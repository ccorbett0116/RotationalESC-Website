<div align="center">

# Rotational Equipment Services

Industrial equipment maintenance, repair & optimization platform. Powers the marketing site and customer portal for services covering pumps, compressors, turbines, motors, and related rotating assets.

<br/>

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?logo=react)
![API](https://img.shields.io/badge/Backend-Django%20REST-green?logo=django)
![DB](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)
![CI](https://img.shields.io/badge/Infra-Docker%20%7C%20Nginx%20%7C%20Certbot-lightgrey)

</div>

---

## Table of Contents
1. Overview
2. Tech Stack
3. Architecture
4. Directory Structure
5. Quick Start (Local Dev)
6. Environment Variables
7. Backend Notes
8. Frontend Notes
9. Auto-Update System
10. Deployment (Prod)
11. Testing
12. Maintenance & Operations
13. Troubleshooting
14. Roadmap / Next Ideas
15. Contributing
16. License

---

## 1. Overview
The platform combines a marketing presence with a secure customer portal for asset tracking, service orders, and analytics. Core goals:
- Streamline intake & service order lifecycle
- Provide transparency on equipment health & history
- Automate recurring maintenance scheduling
- Offer extensible reporting & integration points (future)

## 2. Tech Stack
Frontend: React (Vite + SWC), TypeScript, Tailwind CSS, shadcn/ui, Radix Primitives, React Router, React Hook Form + Zod, TanStack Query, Recharts

Backend: Django / Django REST Framework, PostgreSQL (assumed), Stripe (in `orders/stripe_service.py`), Pillow (likely for media), Gunicorn (production)

Tooling & Infra: Docker + Compose, Nginx (reverse proxy + static), Certbot (Let's Encrypt), Systemd timers (auto-update), Poetry (backend dependency management), Node + Bun lockfile for frontend deps.

## 3. Architecture
High-level flow:
Browser → Nginx → (Static frontend + reverse proxy) → Django app (Gunicorn) → PostgreSQL
						 │
						 └─> Media (volume) & Certbot for TLS

Key Components:
- `frontend` (Vite) served as built static bundle via Nginx
- `backend` Django REST API powering data and auth
- Auto-update script optionally pulling latest images & restarting containers
- Certbot container renewing TLS & sharing certs volume with Nginx

## 4. Directory Structure (Prod Host)
```
/srv/RotationalESC-Website/
├── docker-compose.yml          # Orchestration of services
├── .env                        # Environment variables (NOT committed)
├── backend/                    # Django project + apps
├── certbot/                    # Certbot config & renewal logs
├── database/                   # Mounted DB volume (Postgres data)
├── nginx.conf                  # Nginx reverse proxy + static rules
├── nginx-entrypoint.sh         # Nginx container init
└── certbot-entrypoint.sh       # Certbot container init
```

Auto-Update System (created outside repo):
```
/usr/local/bin/docker-auto-update.sh      # Main update script
/etc/systemd/system/docker-auto-update.service
/etc/systemd/system/docker-auto-update.timer
/var/log/docker-auto-update.log           # Run logs
/tmp/docker-update.lock                   # Concurrency lock
```

## 5. Quick Start (Local Dev)
Prereqs: Docker, Docker Compose, Node (v18+), Python 3.11+, Poetry, (optional) Make.

Clone & bootstrap:
```bash
git clone <repo-url> RotationalESC-Website
cd RotationalESC-Website
cp .env.example .env   # If provided; otherwise create using section 6
docker compose up --build -d
```

Run backend tests:
```bash
docker compose exec backend pytest -q
```

Run frontend in watch (if developing outside container):
```bash
cd frontend || cd .   # adjust if path separated
npm install
npm run dev
```

### Make Targets (if Makefile contains them)
```bash
make build
make up
make logs
make down
```

## 6. Environment Variables
Common (illustrative — confirm actual names):
```
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_HOST=database
DJANGO_SECRET_KEY=
DJANGO_DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```
Frontend (Vite) variables must be prefixed with `VITE_` (e.g. `VITE_API_BASE_URL`).

## 7. Backend Notes
- Apps: `company`, `contact`, `orders`, `products` (domain-specific models & serializers)
- Tests: Each app has `tests.py`; root contains quick connectivity tests (`test_api.py`, `test_db_connection.py`).
- Stripe integration in `orders/stripe_service.py`
- Migrations stored per app under `migrations/`
- Media uploads under `backend/media/` (ensure volume mapping in compose)

## 8. Frontend Notes
- State/Data: TanStack Query for server cache + RHF + Zod for forms & validation
- UI: Tailwind + shadcn/ui components for consistent design
- Routing: React Router (see `src/pages/`)
- Services / API wrappers: `src/services/`
- Recharts for analytics dashboards (equipment performance & trends)

## 9. Auto-Update System
Purpose: Periodically pull latest container images & recreate services with minimal downtime.

Run Cycle:
1. Systemd timer triggers every 10 minutes
2. Script acquires `/tmp/docker-update.lock`
3. `docker compose pull` → compare digests
4. If changes: `docker compose up -d` & log outcome
5. Expired lock removed on completion/error

Safety Considerations:
- Use healthchecks (add if not present) before switching traffic
- Consider staging environment for canary updates
- Keep log rotation for `/var/log/docker-auto-update.log`

Manual Run:
```bash
sudo systemctl start docker-auto-update.service
sudo journalctl -u docker-auto-update.service -n 50 -f
```

Disable Temporarily:
```bash
sudo systemctl stop docker-auto-update.timer
```

## 10. Deployment (Production)
Typical Steps:
1. Provision host (Ubuntu LTS) + Docker + Docker Compose plugin
2. Create `/srv/RotationalESC-Website` & pull repo
3. Populate `.env` (secure secrets!)
4. `docker compose up -d --build`
5. Confirm TLS via Certbot container (auto-renew)
6. Enable auto-update timer (optional)

### Zero-Downtime Tips
- Use `docker compose pull && docker compose up -d` (already in script)
- Add healthchecks to backend & Nginx services
- Keep backup of last working image digests

## 11. Testing
Backend:
```bash
docker compose exec backend pytest -q
```
Add new tests per app; prefer factory pattern if adding complex models.

Frontend (example):
```bash
npm test
```

API Smoke (inside backend container):
```bash
python test_api.py
```

## 12. Maintenance & Operations
- Rotate logs: configure `logrotate` for `/var/log/docker-auto-update.log`
- Renew certs: Certbot handles; verify with `docker compose logs certbot`
- DB backups: Add cron + `pg_dump` (not yet described here)
- Security updates: Base images & Python deps via periodic rebuilds

## 13. Troubleshooting
| Symptom | Check | Fix |
|---------|-------|-----|
| 502 Bad Gateway | `docker compose ps` backend up? | Rebuild backend, check Gunicorn logs |
| Cert errors | Certbot logs | Ensure port 80 reachable & DNS correct |
| Auto-update not running | `systemctl list-timers` | Re-enable timer/service |
| Static not updating | Browser cache | Hard refresh / increment asset hash |

## 14. Roadmap / Next Ideas
- Equipment condition monitoring ingestion (IoT feeds)
- Websocket / SSE for live job status
- Role-based access & audit trails
- Reporting export (CSV / PDF)
- Alerting & predictive maintenance models

## 15. Contributing
1. Fork repo / create feature branch from `dev`
2. Write tests for changes
3. Run linters & formatters (add Prettier / Ruff as needed)
4. Open PR → include concise description & screenshots for UI

## 16. License
Proprietary / All Rights Reserved (update if OSS licensing desired)

---
Questions or improvements? Open an issue or start a discussion.

</div>