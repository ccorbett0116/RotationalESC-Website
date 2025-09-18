# Private Backend Deployment Guide

This guide explains how to deploy the frontend and backend on separate machines with a private backend.

## File Structure

After cleanup, the deployment uses these key files:
- `docker-compose.dev.yml` - Development environment (both services)
- `docker-compose.frontend.yml` - Production frontend-only deployment
- `docker-compose.backend.yml` - Production backend-only deployment
- `nginx.conf` - Production nginx configuration with backend proxy
- `nginx.dev.conf` - Development nginx configuration

## Architecture Overview

```
Internet → Frontend Machine (Public) → Backend Machine (Private)
           nginx proxy              Django API
           ports 80/443             port 8000 (private)
```

## Machine Setup

### Frontend Machine (Public-facing)
- **Purpose**: Serves static files, proxies API calls to backend
- **Public ports**: 80 (HTTP), 443 (HTTPS)
- **Components**: nginx, frontend static files, SSL certificates

### Backend Machine (Private)
- **Purpose**: Handles API requests, database operations
- **Private port**: 8000 (accessible only from frontend machine)
- **Components**: Django application, database, media files

## Deployment Steps

### 1. Backend Machine Setup

1. **Configure environment variables**:
   ```bash
   # Copy .env.example to .env and configure:
   FRONTEND_HOST=10.0.1.50  # IP of your frontend machine
   PRODUCTION_DOMAIN=yourdomain.com
   DEBUG=False
   ```

2. **Deploy backend**:
   ```bash
   # On backend machine
   docker-compose -f docker-compose.backend.yml up -d
   ```

3. **Verify backend is running**:
   ```bash
   curl http://localhost:8000/api/health/
   ```

### 2. Frontend Machine Setup

1. **Configure environment variables**:
   ```bash
   # Copy .env.example to .env and configure:
   BACKEND_HOST=10.0.1.100  # IP of your backend machine
   PRODUCTION_DOMAIN=yourdomain.com
   ```

2. **Update nginx configuration**:
   ```bash
   # Use the production nginx config
   cp nginx.prod.conf nginx.conf
   # Edit nginx.conf and replace ${BACKEND_HOST} with actual backend IP
   ```

3. **Deploy frontend**:
   ```bash
   # On frontend machine
   docker-compose -f docker-compose.frontend.yml up -d
   ```

### 3. Network Configuration

#### Security Rules
- **Frontend machine**: Allow inbound 80, 443 from internet
- **Backend machine**: Allow inbound 8000 only from frontend machine IP
- **Both machines**: Allow SSH from your management IPs only

#### Firewall Example (iptables)

**Frontend machine**:
```bash
# Allow HTTP/HTTPS from anywhere
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow outbound to backend
iptables -A OUTPUT -p tcp -d 10.0.1.100 --dport 8000 -j ACCEPT
```

**Backend machine**:
```bash
# Allow inbound from frontend machine only
iptables -A INPUT -p tcp -s 10.0.1.50 --dport 8000 -j ACCEPT

# Deny all other inbound to port 8000
iptables -A INPUT -p tcp --dport 8000 -j DROP
```

## Configuration Files

### Environment Variables

#### Frontend Machine (.env.frontend)
```bash
# Copy .env.frontend and configure:
BACKEND_HOST=10.0.1.100  # IP of your backend machine
PRODUCTION_DOMAIN=yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
OWNER_EMAIL=admin@yourdomain.com
```

#### Backend Machine (.env.backend)
```bash
# Copy .env.backend and configure:
FRONTEND_HOST=10.0.1.50  # IP of your frontend machine
PRODUCTION_DOMAIN=yourdomain.com
DEBUG=False
SECRET_KEY=your-super-secret-django-key-change-this-in-production
DATABASE_URL=sqlite:///app/database/db.sqlite3
STRIPE_SECRET_KEY=sk_live_...
EMAIL_FORWARDER=your-email@gmail.com
EMAIL_FORWARDER_PASSWORD=your-app-password
OWNER_EMAIL=admin@yourdomain.com
OWNER_PASSWORD=SecureAdminPassword123!
```

### Testing the Setup

1. **Test backend directly** (from frontend machine):
   ```bash
   curl http://10.0.1.100:8000/api/products/
   ```

2. **Test frontend proxy**:
   ```bash
   curl https://yourdomain.com/api/products/
   ```

3. **Test user experience**:
   - Visit https://yourdomain.com/shop
   - Verify products load (frontend → nginx → backend)
   - Check browser network tab shows `/api/` calls

## Troubleshooting

### Backend Not Reachable
- Check firewall rules
- Verify backend is listening on correct port: `netstat -tlnp | grep 8000`
- Test connectivity from frontend: `telnet 10.0.1.100 8000`

### API Calls Failing
- Check nginx error logs: `docker logs rotational-frontend`
- Verify nginx config syntax: `docker exec rotational-frontend nginx -t`
- Check backend logs: `docker logs rotational-backend`

### CORS Issues
- Ensure ALLOWED_HOSTS includes frontend machine IP
- Check Django CORS settings if using django-cors-headers

## Security Considerations

1. **Backend Isolation**: Backend has no public internet access
2. **Firewall Rules**: Strict rules allowing only necessary traffic
3. **SSL Termination**: Only frontend handles SSL certificates
4. **Database Security**: Database files only on backend machine
5. **Secret Management**: Different secrets on each machine

## Monitoring

### Health Checks
- Frontend: `https://yourdomain.com/health`
- Backend: `curl http://backend-ip:8000/api/health/` (from frontend machine)

### Log Monitoring
```bash
# Frontend logs
docker logs -f rotational-frontend

# Backend logs  
docker logs -f rotational-backend
```

## Backup Strategy

### Backend Machine
- Database: `./database/` directory
- Media files: `./backend/media/` directory
- Environment: `.env` file

### Frontend Machine
- SSL certificates: `./certbot/certs/` directory
- Environment: `.env` file

## Updates and Maintenance

### Backend Updates
```bash
# On backend machine
git pull
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d
```

### Frontend Updates
```bash
# On frontend machine
git pull
docker-compose -f docker-compose.frontend.yml build
docker-compose -f docker-compose.frontend.yml up -d
```

This setup provides a secure, scalable architecture where users never directly access your backend services.