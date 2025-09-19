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
    # Try to run migrations, but handle conflicts automatically
    if ! python manage.py migrate 2>&1; then
        echo "Migration conflict detected. Attempting to auto-merge..."
        # Check if the error mentions conflicting migrations
        if python manage.py migrate 2>&1 | grep -q "Conflicting migrations detected"; then
            echo "Running makemigrations --merge to resolve conflicts..."
            echo "y" | python manage.py makemigrations --merge
            echo "Re-running migrations after merge..."
            python manage.py migrate
        else
            echo "Migration failed for non-conflict reasons. Exiting."
            exit 1
        fi
    fi
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

echo "Database setup complete. Starting Gunicorn server..."

# Start Gunicorn WSGI server
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 rotational_equipment.wsgi:application
