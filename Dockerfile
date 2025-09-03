# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install bun
RUN npm install -g bun

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["bun", "run", "preview", "--host", "0.0.0.0", "--port", "8080"]
