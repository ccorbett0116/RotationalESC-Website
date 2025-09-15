FROM alpine:latest

# Install required packages
RUN apk add --no-cache docker-compose docker-cli

# Create scripts directory
WORKDIR /scripts

# Copy analytics script
COPY update_analytics.sh /scripts/update_analytics.sh
RUN chmod +x /scripts/update_analytics.sh

# Set up cron job
RUN echo '0 2 * * * cd /scripts && /scripts/update_analytics.sh >> /var/log/analytics.log 2>&1' > /etc/crontabs/root

# Create log file
RUN touch /var/log/analytics.log

# Run cron in foreground
CMD echo 'Analytics cron scheduled for 2 AM daily' && crond -f -d 8