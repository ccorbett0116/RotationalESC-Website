# Step 1: Use a Node.js image to build the app
FROM oven/bun:1 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the app's source code
COPY . .

# Build the app
RUN bun run build

# Step 2: Use an Nginx image to serve the static files
FROM nginx:alpine

# Copy the build files from the builder stage to the Nginx web directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the unified nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Install required packages for envsubst (gettext) and openssl used in entrypoint
RUN apk add --no-cache bash gettext openssl

# Copy nginx entrypoint script and make it executable
COPY ./nginx-entrypoint.sh /nginx-entrypoint.sh
RUN chmod +x /nginx-entrypoint.sh

# Expose ports 80 and 443
EXPOSE 80 443

# Use the nginx entrypoint script
ENTRYPOINT ["/nginx-entrypoint.sh"]
