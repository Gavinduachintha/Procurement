# Procurement Documentation & Notification System

This repository contains a full-stack university procurement workflow system:

- Backend: Node.js + Express + PostgreSQL
- Frontend: React + TypeScript + Vite

The goal of this documentation set is maintainability for rotating developers.

## Documentation Map

1. [System Overview](docs/system-overview.md)
2. [Backend Developer Guide](Backend/README.md)
3. [Frontend Developer Guide](Frontend/README.md)
4. [API Reference](docs/api-reference.md)
5. [Deployment & Maintenance Runbook](docs/deployment-maintenance.md)
6. [Developer Onboarding Checklist](docs/developer-onboarding.md)

## Quick Start (Local)

### 1) Backend

1. Go to Backend
2. Install dependencies
3. Set environment variables
4. Start server

Minimum required environment variables:

- `PORT` (default: `3000`)
- `DATABASE_URL` (or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)
- `JWT_SECRET` (must be set securely in production)
- `JWT_EXPIRES_IN` (default: `8h`)

Startup behavior:

- Server checks if target database exists and creates it if needed
- Schema is auto-initialized at startup

### 2) Frontend

1. Go to Frontend
2. Install dependencies
3. Set `VITE_API_BASE_URL` if backend is not on local default
4. Start dev server

Default API base URL:

- `http://localhost:3000/api`

## Notes for New Developers

- Read [docs/system-overview.md](docs/system-overview.md) first.
- Then read role-based workflow in [Backend/README.md](Backend/README.md).
- Use [docs/api-reference.md](docs/api-reference.md) while implementing frontend or integrations.
- For production changes and handover, follow [docs/deployment-maintenance.md](docs/deployment-maintenance.md).
