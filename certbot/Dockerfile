FROM certbot/certbot:latest

# Install docker CLI to allow container communication
RUN apk add --no-cache docker-cli

# Set the working directory
WORKDIR /opt/certbot

# Copy the certbot entrypoint script
COPY certbot-entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

# Keep the original entrypoint
ENTRYPOINT [""]
