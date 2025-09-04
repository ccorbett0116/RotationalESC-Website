FROM certbot/certbot:latest

# Install docker CLI to allow container communication
RUN apk add --no-cache docker-cli

# Set the working directory
WORKDIR /opt/certbot

# Copy any custom scripts if needed
# COPY scripts/ /opt/certbot/scripts/

# Keep the original entrypoint
ENTRYPOINT [""]
