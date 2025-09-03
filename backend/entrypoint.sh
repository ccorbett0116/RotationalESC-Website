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
    poetry run python manage.py migrate
else
    echo "Database file found. Running migrations to ensure schema is up to date..."
    poetry run python manage.py migrate
fi

# Check database connection
echo "Testing database connection..."
poetry run python manage.py check --database default

echo "Database setup complete. Starting Django server..."

# Start the Django development server
exec poetry run python manage.py runserver 0.0.0.0:8000
