# Backend Developer Guide

## Stack

- Node.js (ES modules)
- Express 5
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcrypt`)

## Run Modes

- `npm run dev` -> watch mode server
- `npm start` -> normal server

## Environment Variables

Supported variables:

- `PORT` (default `3000`)
- `DATABASE_URL`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (used when `DATABASE_URL` is not set)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `8h`)

### Production Requirements

- Set `JWT_SECRET` explicitly (strong random value)
- Set `DATABASE_URL` explicitly
- Do not commit real secrets

## Startup Sequence

Server startup flow:

1. Parse env
2. Ensure PostgreSQL target DB exists
3. Test DB connection
4. Run schema initialization
5. Start HTTP server

Main files:

- `server.js`
- `src/config/env.js`
- `src/config/db.js`
- `src/db/initSchema.js`

## Folder Responsibilities

- `src/routes`: endpoint registration
- `src/controllers`: request parsing and response shaping
- `src/services`: business rules and permission checks
- `src/repositories`: SQL queries only
- `src/middleware`: auth and error middleware
- `src/utils`: constants, errors, number generators

## Authorization Rules (Business Critical)

### Request submission

- Only `REQUESTING_OFFICER`
- System auto-assigns checker based on item type

### Specification review

- Only `DIRECTOR_ICT` or `MAINTENANCE_ENGINEER`
- Checker must match `specification_checker_id`
- Review returns request to requester (cannot skip directly to procurement)

### Requester confirmation

- Only owner requester
- `ACCEPT` -> moves to `APPROVAL_PENDING`
- `REQUEST_MODIFICATION` -> moves to `SPEC_REWORK_REQUESTED`

### Approval decision

- Only approver roles (`DEAN`, `REGISTRAR`, `BURSAR`, `VICE_CHANCELLOR`)
- Aggregate rule:
  - any reject -> request status `REJECTED`
  - any clarification -> request status `CLARIFICATION_REQUESTED`
  - all approved -> request status `APPROVED`
  - otherwise remain pending

### Procurement actions

- `SUPPLY_BRANCH` only:
  - create supplier
  - list suppliers
  - start job / choose method
  - assign clerk
- `SUBJECT_CLERK` or `SUPPLY_BRANCH`:
  - select category
  - select suppliers
  - generate quotation letters

## Database

- DDL source: [schema.sql](schema.sql)
- Auto-init source: `src/db/initSchema.js`
- Seed source: [seed-data.sql](seed-data.sql)

### Seed data note

`seed-data.sql` contains placeholder password hashes and is for structure/testing only. Replace with proper user provisioning flow for real environments.

## API Surface

Base path: `/api`

Main route groups:

- `/auth`
- `/requests`
- `/specifications`
- `/approvals`
- `/procurement`
- `/dashboard`

Full endpoint contract: see [../docs/api-reference.md](../docs/api-reference.md)

## Error Handling

- Controlled service errors use `ApiError(status, message)`
- Unknown errors return HTTP `500`
- Missing routes return HTTP `404`

## Development Conventions

1. Add new rule in service layer first
2. Keep controllers thin
3. Keep repositories SQL-only
4. Reuse constants from `src/utils/constants.js`
5. Keep status transition logic centralized in services

## Common Change Recipes

### Add a new request status

1. Add constant in `src/utils/constants.js`
2. Update relevant service transition logic
3. Update frontend status display logic
4. Update docs in [../docs/system-overview.md](../docs/system-overview.md)

### Add a new API endpoint

1. Add service method
2. Add controller method
3. Wire route in `src/routes/*.js`
4. Add frontend API wrapper in `Frontend/src/api`
5. Document in [../docs/api-reference.md](../docs/api-reference.md)

### Add a DB column

1. Update `schema.sql`
2. Update `src/db/initSchema.js`
3. Update repository queries and model typing on frontend
4. Update seed script if needed

## Minimum Pre-Deploy Checks

- Backend starts without schema errors
- Protected endpoints reject missing/invalid token
- Role restrictions behave correctly
- Request -> spec -> approval -> procurement flow works end-to-end
