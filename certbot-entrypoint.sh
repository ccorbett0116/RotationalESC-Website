#!/bin/bash

echo "Starting certbot service..."

# Function to reload nginx
reload_nginx() {
    echo "Attempting to reload nginx..."
    # Try to send HUP signal to nginx process in the frontend container
    if command -v docker >/dev/null 2>&1; then
        docker exec rotational-frontend nginx -s reload 2>/dev/null || \
        docker kill -s HUP rotational-frontend 2>/dev/null || \
        echo "Could not reload nginx - container may not be ready"
    else
        echo "Docker command not available, nginx reload will happen on next restart"
    fi
}

# Check if certificate already exists
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "No certificate found for $DOMAIN. Creating initial certificate..."
    
    # Create dummy certificate first to allow nginx to start
    mkdir -p "/etc/letsencrypt/live/$DOMAIN"
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
        -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
        -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=localhost"
    
    echo "Dummy certificate created. Waiting for nginx to start..."
    sleep 60
    
    # Remove dummy certificate and get real one
    rm -rf "/etc/letsencrypt/live/$DOMAIN"
    rm -rf "/etc/letsencrypt/archive/$DOMAIN"
    rm -rf "/etc/letsencrypt/renewal/$DOMAIN.conf"
    
    # Request real certificate
    echo "Requesting real certificate for $DOMAIN..."
    certbot certonly --webroot -w /var/www/certbot \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --rsa-key-size 4096 \
        --agree-tos \
        --non-interactive \
        --force-renewal \
        --verbose || echo "Initial certificate request failed, will retry in renewal loop"
    
    # Reload nginx
    reload_nginx
else
    echo "Certificate already exists for $DOMAIN"
fi

# Start renewal loop
while :; do
    echo "Checking certificate renewal..."
    certbot renew --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --quiet \
        --deploy-hook "touch /var/www/certbot/.nginx-reload" || true
    
    # Check if nginx needs to be reloaded
    if [ -f "/var/www/certbot/.nginx-reload" ]; then
        reload_nginx
        rm -f "/var/www/certbot/.nginx-reload"
    fi
    
    echo "Sleeping for 12 hours..."
    sleep 43200
done
