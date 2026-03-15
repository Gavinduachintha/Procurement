# Deployment & Maintenance Runbook

This runbook is intended for university server hosting and team handover.

## 1) Prerequisites

- Node.js LTS (same major version for all developers and server)
- PostgreSQL server
- Process manager (recommended: PM2 or systemd service)
- Reverse proxy (recommended: Nginx/Apache) for HTTPS and routing

## 2) Environment Setup

### Backend required configuration

- `PORT`
- `DATABASE_URL` (preferred)
- `JWT_SECRET` (mandatory in production)
- `JWT_EXPIRES_IN`

Optional split DB vars if not using `DATABASE_URL`:

- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### Frontend required configuration

- `VITE_API_BASE_URL` (should point to backend `/api` endpoint)

## 3) Production Deployment Flow

### Backend

1. Pull latest code
2. Install dependencies in `Backend`
3. Set environment variables
4. Start/restart backend process
5. Verify health endpoint `/api/health`

### Frontend

1. Pull latest code
2. Install dependencies in `Frontend`
3. Set `VITE_API_BASE_URL`
4. Build static assets
5. Deploy built assets behind web server

## 4) Database Management

## Schema source of truth

- Primary SQL schema: [../Backend/schema.sql](../Backend/schema.sql)
- Runtime auto-init: `Backend/src/db/initSchema.js`

Keep both synchronized when schema changes.

## Seed data

- [../Backend/seed-data.sql](../Backend/seed-data.sql) is for test/demo setup
- Do not run seed blindly in production

## Backups (minimum policy)

- Daily automated backup
- Keep at least 14 days retention
- Test restore monthly

Suggested backup targets:

- all transactional tables
- users and approvals
- jobs and quotation records
- notifications (optional per retention policy)

## 5) Release Management (Multi-Developer)

Use this lightweight process:

1. Feature branch per change
2. Pull request with summary and impacted modules
3. Reviewer checks:
   - role permissions
   - status transitions
   - API contract compatibility
4. Update docs in same PR
5. Tag release and record deployment note

## 6) Documentation Update Policy

When any of these change, update docs before merge:

- route path or payload
- status names or transitions
- database schema
- role permissions
- deployment steps

Files to keep current:

- [system-overview.md](system-overview.md)
- [api-reference.md](api-reference.md)
- [../Backend/README.md](../Backend/README.md)
- [../Frontend/README.md](../Frontend/README.md)

## 7) Troubleshooting Quick Guide

### Backend fails to start

Check:

- DB server reachable
- `DATABASE_URL` correctness
- server logs for SQL or auth issues

### Login fails for all users

Check:

- backend running
- correct frontend `VITE_API_BASE_URL`
- JWT secret not accidentally changed between restarts

### 401 errors on protected routes

Check:

- Authorization header format `Bearer <token>`
- token expiry (`JWT_EXPIRES_IN`)
- browser local storage token replaced or cleared

### Request stuck in workflow

Check current request `status` and related approval/spec rows in DB:

- `purchase_requests`
- `specification_reviews`
- `approvals`

## 8) Security Checklist

- Never use default/fallback JWT secret in production
- Enforce HTTPS at reverse proxy
- Restrict DB network access
- Rotate secrets periodically
- Limit who can register privileged roles in production operations

## 9) Recommended Future Hardening

- Add automated migrations (instead of only startup init)
- Add audit logging for critical decisions
- Add integration tests for role-based transitions
- Add real email delivery provider for notifications
- Add centralized error and access logs
