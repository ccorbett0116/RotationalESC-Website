# Makefile for Rotational Equipment Services Docker Compose Management

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Rotational Equipment Services - Docker Compose Management"
	@echo "========================================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker Compose Commands
.PHONY: up
up: ## Start all services in detached mode
	docker compose up -d

.PHONY: down
down: ## Stop and remove all containers
	docker compose down

.PHONY: restart
restart: ## Restart all services
	docker compose restart

.PHONY: stop
stop: ## Stop all services without removing containers
	docker compose stop

.PHONY: start
start: ## Start existing stopped containers
	docker compose start

.PHONY: build
build: ## Build all services
	docker compose build

.PHONY: rebuild
rebuild: ## Stop, remove containers, rebuild images, and start services
	docker compose down
	docker compose build
	docker compose up -d

.PHONY: pull
pull: ## Pull latest images for all services
	docker compose pull

# Individual Service Commands
.PHONY: up-backend
up-backend: ## Start only the backend service
	docker compose up -d backend

.PHONY: up-frontend
up-frontend: ## Start only the frontend service
	docker compose up -d frontend

.PHONY: restart-backend
restart-backend: ## Restart only the backend service
	docker compose restart backend

.PHONY: restart-frontend
restart-frontend: ## Restart only the frontend service
	docker compose restart frontend

.PHONY: build-backend
build-backend: ## Build only the backend service
	docker compose build backend

.PHONY: build-frontend
build-frontend: ## Build only the frontend service
	docker compose build frontend

# Logs and Monitoring
.PHONY: logs
logs: ## Show logs for all services
	docker compose logs -f

.PHONY: logs-backend
logs-backend: ## Show logs for backend service
	docker compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Show logs for frontend service
	docker compose logs -f frontend

.PHONY: ps
ps: ## Show running containers
	docker compose ps

.PHONY: top
top: ## Show running processes in containers
	docker compose top

# Development Commands
.PHONY: shell-backend
shell-backend: ## Access backend container shell
	docker compose exec backend bash

.PHONY: shell-frontend
shell-frontend: ## Access frontend container shell
	docker compose exec frontend sh

.PHONY: dev
dev: ## Start services and show logs (development mode)
	docker compose up --build

.PHONY: dev-backend
dev-backend: ## Start backend in development mode with logs
	docker compose up --build backend

.PHONY: dev-frontend
dev-frontend: ## Start frontend in development mode with logs
	docker compose up --build frontend

# Cleanup Commands
.PHONY: clean
clean: ## Remove containers, networks, and volumes
	docker compose down -v --remove-orphans

.PHONY: clean-images
clean-images: ## Remove all project-related images
	docker compose down --rmi all

.PHONY: clean-all
clean-all: ## Complete cleanup (containers, networks, volumes, images)
	docker compose down -v --rmi all --remove-orphans

.PHONY: prune
prune: ## Remove unused Docker resources (system-wide)
	docker system prune -f

.PHONY: prune-all
prune-all: ## Remove all unused Docker resources including volumes
	docker system prune -a -f --volumes

# Database Commands
.PHONY: backup-db
backup-db: ## Backup database
	@echo "Creating database backup..."
	@mkdir -p backups
	@timestamp=$$(date +"%Y%m%d_%H%M%S"); \
	docker compose exec backend python manage.py dumpdata > "backups/db_backup_$$timestamp.json" && \
	echo "Database backup created: backups/db_backup_$$timestamp.json"

.PHONY: migrate
migrate: ## Run database migrations
	docker compose exec backend python manage.py migrate

.PHONY: makemigrations
makemigrations: ## Create new database migrations
	docker compose exec backend python manage.py makemigrations

.PHONY: collectstatic
collectstatic: ## Collect static files
	docker compose exec backend python manage.py collectstatic --noinput

# Health Checks
.PHONY: health
health: ## Check health of all services
	@echo "Checking service health..."
	@echo "Backend health:"
	@curl -s http://localhost:8000/admin/ > /dev/null && echo "✅ Backend is responding" || echo "❌ Backend is not responding"
	@echo "Frontend health:"
	@curl -s http://localhost:8080/ > /dev/null && echo "✅ Frontend is responding" || echo "❌ Frontend is not responding"

# Quick Commands
.PHONY: quick-start
quick-start: ## Quick start - build and run all services
	@echo "🚀 Starting Rotational Equipment Services..."
	docker compose up -d --build
	@echo "✅ Services started successfully!"
	@echo "🌐 Frontend: http://localhost:8080"
	@echo "🔧 Backend Admin: http://localhost:8000/admin"

.PHONY: quick-stop
quick-stop: ## Quick stop - stop all services
	@echo "🛑 Stopping all services..."
	docker compose down
	@echo "✅ All services stopped!"

# Default target when no command is specified
.DEFAULT_GOAL := help
