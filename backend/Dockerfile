# IODMS Backend Dockerfile
# -------------------------
# This creates a container with Python 3.12 and all our backend dependencies.
# We use python:3.12-slim (a smaller version of the Python image) to save space.

FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Install system-level dependencies needed by psycopg (PostgreSQL driver)
# libpq-dev provides the PostgreSQL client library that psycopg needs
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first (Docker caches this layer separately,
# so if dependencies haven't changed, it skips re-installing them)
COPY requirements.txt ./

# Install all Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code into the container
COPY . .

# Create a directory for uploaded documents inside the container
# This will be mapped to a real folder on the host via a Docker volume
RUN mkdir -p /data/IODMS_DATA/Inward /data/IODMS_DATA/Outward /data/IODMS_DATA/Drafts

# Expose port 8000 (FastAPI runs on this port)
EXPOSE 8000

# Start the FastAPI server using Uvicorn
# --host 0.0.0.0 means "accept connections from any IP" (needed inside Docker)
# Without this, the server would only accept connections from inside the container itself
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
