#!/bin/bash

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if required environment variables are set
if [ -z "$OWNER_EMAIL" ] || [ -z "$PRODUCTION_DOMAIN" ]; then
    echo "Error: OWNER_EMAIL and PRODUCTION_DOMAIN must be set in .env file"
    exit 1
fi

echo "Initializing Let's Encrypt certificates for $PRODUCTION_DOMAIN with email $OWNER_EMAIL"

# Create dummy certificate for nginx to start
echo "Creating dummy certificate for $PRODUCTION_DOMAIN..."
mkdir -p ./certs/live/$PRODUCTION_DOMAIN
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout '/etc/letsencrypt/live/$PRODUCTION_DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$PRODUCTION_DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "Starting nginx..."
docker-compose up --force-recreate -d frontend

echo "Deleting dummy certificate for $PRODUCTION_DOMAIN..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$PRODUCTION_DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$PRODUCTION_DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$PRODUCTION_DOMAIN.conf" certbot

echo "Requesting Let's Encrypt certificate for $PRODUCTION_DOMAIN..."
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $OWNER_EMAIL \
    -d $PRODUCTION_DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot

echo "Reloading nginx..."
docker-compose exec frontend nginx -s reload

echo "Certificate initialization complete!"
echo "Your site should now be accessible at https://$PRODUCTION_DOMAIN"
echo "HTTP traffic will automatically redirect to HTTPS"
