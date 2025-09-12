#!/bin/sh

# Analytics Update Script
# This script should be run daily via cron to update analytics summaries

echo "Starting analytics update at $(date)"

# Change to the project directory
cd "/home/chance/Rotational Equipment Services" || exit 1

# Check if backend container is running
if ! docker compose ps backend | grep -q "Up"; then
    echo "Backend container is not running. Exiting."
    exit 1
fi

# Run the analytics update command
docker compose exec -T backend python manage.py update_analytics --days=1 --update-products --generate-summaries

if [ $? -eq 0 ]; then
    echo "Analytics update completed successfully at $(date)"
else
    echo "Analytics update failed at $(date)"
    exit 1
fi