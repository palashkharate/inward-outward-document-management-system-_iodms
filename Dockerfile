# ==========================================
# IODMS Unified Server Dockerfile
# ==========================================
# This is a Multi-Stage Docker build.
# Stage 1: Builds the React frontend using Node.js
# Stage 2: Packages the Python backend and includes the compiled React app.
# The final image ONLY contains the compiled React files and Python backend,
# keeping it small and secure (no Node.js in the final image!).

# ------------------------------------------
# Stage 1: Build the React Frontend
# ------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package.json and package-lock.json first (for caching)
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code and build it
COPY frontend/ ./
RUN npm run build

# ------------------------------------------
# Stage 2: Build the Python Backend & Serve
# ------------------------------------------
FROM python:3.12-slim
WORKDIR /app

# Install system-level dependencies for psycopg (PostgreSQL driver)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install them
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend source code
COPY backend/ ./backend/

# Copy the compiled React frontend from Stage 1 into the correct location
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create necessary data directories
RUN mkdir -p /data/IODMS_DATA/Inward /data/IODMS_DATA/Outward /data/IODMS_DATA/Drafts /app/settings_data

# The Unified IODMS Server will run on port 80 natively in the container
EXPOSE 80

# Start the FastAPI server on port 80.
# The Python server is configured to serve the React frontend at the same time.
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
