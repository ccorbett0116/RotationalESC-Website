# Docker Setup for Rotational ESC Website

This project has been containerized using Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Build and run the containers:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

## Database

The SQLite database is stored in the `./database` directory, which is bind-mounted to the backend container. This ensures data persistence between container restarts.

### Initial Setup

If this is your first time running the application, you may need to run migrations and create a superuser:

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create a superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

## Development

### Building individual services

```bash
# Build only the backend
docker-compose build backend

# Build only the frontend
docker-compose build frontend
```

### Running in development mode

```bash
# Run with logs visible
docker-compose up

# Run in background
docker-compose up -d
```

### Stopping the services

```bash
docker-compose down
```

## File Structure

```
.
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Frontend Dockerfile
├── backend/
│   ├── Dockerfile             # Backend Dockerfile
│   └── .dockerignore          # Backend Docker ignore
├── database/                  # SQLite database directory (bind-mounted)
└── .dockerignore              # Frontend Docker ignore
```

## Environment Variables

The following environment variables are configured in docker-compose.yml:

### Backend
- `DEBUG=True` - Django debug mode
- `ALLOWED_HOSTS=localhost,127.0.0.1,backend` - Allowed hosts for Django

### Frontend
- `VITE_API_URL=http://localhost:8000` - API URL for the frontend

## Volumes

- `./database:/app/database` - SQLite database persistence
- `./backend/media:/app/media` - Media files persistence

## Networks

Both services are connected via a custom bridge network `rotational-network` for internal communication.

## Troubleshooting

### Port conflicts
If ports 8000 or 8080 are already in use, modify the port mappings in docker-compose.yml:

```yaml
ports:
  - "8001:8000"  # Change host port to 8001
```

### Database issues
If you encounter database issues, you can reset the database by:

1. Stopping the containers: `docker-compose down`
2. Removing the database file: `rm -f database/db.sqlite3`
3. Starting the containers: `docker-compose up --build`
4. Running migrations: `docker-compose exec backend python manage.py migrate`
