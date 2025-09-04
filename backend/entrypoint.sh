#!/bin/bash

# Exit on any error
set -e

echo "Starting backend service..."

# Ensure database directory exists with proper permissions
mkdir -p /app/database
chmod 755 /app/database

# Check if database file exists, if not, run migrations
if [ ! -f "/app/database/db.sqlite3" ]; then
    echo "Database file not found. Running initial migrations..."
    python manage.py migrate
else
    echo "Database file found. Running migrations to ensure schema is up to date..."
    python manage.py migrate
fi

# Check database connection
echo "Testing database connection..."
python manage.py check --database default

# Ensure superuser exists
echo "Ensuring superuser exists..."
python manage.py ensure_superuser

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Database setup complete. Starting Django server..."

# Start the Django development server
exec python manage.py runserver 0.0.0.0:8000
