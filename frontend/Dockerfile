# --- Stage 1: Build the React app ---
# We use a Node.js image to install dependencies and compile the React code
# into optimized static HTML/CSS/JS files.
FROM node:20-alpine AS build

# Set the working directory inside this temporary container
WORKDIR /app

# Copy package.json first (Docker caches this layer, so if dependencies
# haven't changed, it skips re-downloading them — saves time on rebuilds)
COPY package.json ./

# Install all npm dependencies
RUN npm install

# Now copy the rest of the frontend source code
COPY . .

# Build the production-optimized static files into /app/dist/
RUN npm run build


# --- Stage 2: Serve with Nginx ---
# We use a tiny, production-grade Nginx web server to serve the built files.
# This container is only ~40 MB compared to the ~1 GB Node.js container above.
FROM nginx:alpine

# Copy our custom Nginx configuration (handles /api proxying to the backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React files from Stage 1 into Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Start Nginx in the foreground (required for Docker containers)
CMD ["nginx", "-g", "daemon off;"]
