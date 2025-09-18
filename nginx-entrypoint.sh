#!/bin/sh

# Set default production domain if not provided
if [ -z "$PRODUCTION_DOMAIN" ]; then
    export PRODUCTION_DOMAIN="example.com"
fi

echo "Starting nginx for domain: $PRODUCTION_DOMAIN"

# Create runtime configuration file for frontend
echo "Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  VITE_STRIPE_PUBLISHABLE_KEY: "${VITE_STRIPE_PUBLISHABLE_KEY:-}",
  VITE_API_URL: "${VITE_API_URL:-https://${PRODUCTION_DOMAIN}/api}"
};
EOF

# Substitute environment variables in nginx config template
envsubst '${PRODUCTION_DOMAIN} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Check if SSL certificate exists and create dummy if needed
if [ ! -f "/etc/letsencrypt/live/${PRODUCTION_DOMAIN}/fullchain.pem" ]; then
    echo "WARNING: SSL certificate not found at /etc/letsencrypt/live/${PRODUCTION_DOMAIN}/fullchain.pem"
    echo "Creating directory structure and waiting for certbot to provide certificates..."
    
    # Create directory structure
    mkdir -p "/etc/letsencrypt/live/${PRODUCTION_DOMAIN}"
    
    # Wait a moment for certbot to create certificates
    sleep 10
    
    # If still no certificate, create a temporary one to allow nginx to start
    if [ ! -f "/etc/letsencrypt/live/${PRODUCTION_DOMAIN}/fullchain.pem" ]; then
        echo "Creating temporary self-signed certificate for nginx startup..."
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
            -keyout "/etc/letsencrypt/live/${PRODUCTION_DOMAIN}/privkey.pem" \
            -out "/etc/letsencrypt/live/${PRODUCTION_DOMAIN}/fullchain.pem" \
            -subj "/CN=${PRODUCTION_DOMAIN}"
    fi
fi

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "Nginx configuration test failed. Exiting."
    exit 1
fi

echo "Starting nginx..."
# Start nginx
exec nginx -g "daemon off;"
