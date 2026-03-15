# System Overview

## Purpose

This application digitizes university procurement from request submission to supplier quotation scheduling, with role-based access and notifications.

## Core Workflow

1. Requesting Officer submits purchase request
2. Specification checker reviews specs
   - IT item -> Director ICT
   - Non-IT item -> Maintenance Engineer
3. Requesting Officer confirms reviewed specification
4. Approval officials decide (Dean, Registrar, Bursar, Vice Chancellor)
5. Supply Branch starts procurement and generates job number
6. Supply Branch assigns Subject Clerk
7. Subject Clerk selects supplier category and suppliers
8. Subject Clerk generates quotation letters and views schedule

## Roles

- `REQUESTING_OFFICER`
- `DIRECTOR_ICT`
- `MAINTENANCE_ENGINEER`
- `DEAN`
- `REGISTRAR`
- `BURSAR`
- `VICE_CHANCELLOR`
- `SUPPLY_BRANCH`
- `SUBJECT_CLERK`

## Request Status Values

- `SUBMITTED`
- `SPEC_REVIEW_PENDING`
- `SPEC_RETURNED_TO_REQUESTER`
- `SPEC_REWORK_REQUESTED`
- `SPEC_CONFIRMED_BY_REQUESTER`
- `APPROVAL_PENDING`
- `APPROVED`
- `REJECTED`
- `CLARIFICATION_REQUESTED`
- `PROCUREMENT_STARTED`

## Job Status Values

Observed status lifecycle in current implementation:

- `JOB_CREATED`
- `CLERK_ASSIGNED`
- `CATEGORY_SELECTED`

## Architecture (High Level)

### Backend

Layered pattern:

- `routes` -> HTTP route map
- `controllers` -> request/response orchestration
- `services` -> business rules and authorization checks
- `repositories` -> SQL access
- `config` -> env and DB wiring
- `middleware` -> auth and error handling

### Frontend

Feature-role pattern:

- `context/AuthContext.tsx` stores auth state and token
- `features/*` provides role dashboards
- `api/*` holds typed backend API wrappers
- `types/models.ts` central response model typings

## Authentication Model

- JWT bearer token based
- Token generated on register/login
- Frontend stores token in `localStorage` key: `procurement_token`
- Protected backend routes require header:
  - `Authorization: Bearer <token>`

## Data Model Summary

Main tables:

- `users`
- `purchase_requests`
- `specification_reviews`
- `approvals`
- `jobs`
- `suppliers`
- `job_suppliers`
- `quotation_requests`
- `notifications`

See [Backend/schema.sql](../Backend/schema.sql) for full schema.

## Number Generation

- Request number format: `PR-<year>-<5-digit serial>`
  - Example: `PR-2026-00001`
- Job number format: `<method>-<year>-<3-digit serial>`
  - Example: `NCB-2026-001`

## Notification Triggers (Current)

- Request submitted
- Specification review completed
- Specification accepted / rework requested
- Approval decision updated
- Job number generated

Notifications are stored in DB (`notifications` table). Email transport is not implemented in this codebase yet.

## Important Operational Note

`JWT_SECRET` has a default fallback in code for local convenience. In production, always set a strong secret through environment variables and never rely on fallback values.
