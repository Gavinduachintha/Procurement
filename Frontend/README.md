# Frontend Developer Guide

## Stack

- React 19
- TypeScript
- Vite

## Scripts

- `npm run dev` -> local development
- `npm run build` -> production build (`tsc -b && vite build`)
- `npm run preview` -> preview built app
- `npm run lint` -> lint checks

## Environment Variable

- `VITE_API_BASE_URL`
  - default: `http://localhost:3000/api`

Defined in `src/config/constants.ts`.

## Application Structure

- `src/context/AuthContext.tsx`
  - token/user state
  - login, register, logout functions
  - token persistence via `localStorage` (`procurement_token`)
- `src/api/*`
  - typed backend API wrappers
- `src/features/*`
  - role-based UI modules
- `src/types/models.ts`
  - shared model types used across APIs/components

## Role-Based UI Routing

Main switching logic is in `src/features/common/RoleWorkspace.tsx`.

- `REQUESTING_OFFICER` -> `RequesterDashboard`
- `DIRECTOR_ICT`, `MAINTENANCE_ENGINEER` -> `CheckerDashboard`
- `DEAN`, `REGISTRAR`, `BURSAR`, `VICE_CHANCELLOR` -> `ApproverDashboard`
- `SUPPLY_BRANCH` -> `SupplyBranchDashboard`
- `SUBJECT_CLERK` -> `SubjectClerkDashboard`
- all authenticated users -> `NotificationsPanel`

## API Integration Pattern

All calls use `apiRequest()` in `src/api/client.ts`.

Behavior:

1. Prefixes route with `API_BASE_URL`
2. Adds JSON headers
3. Adds bearer token when provided
4. Throws `ApiClientError(status, message)` for non-2xx responses

## Important Feature Notes

### Requester flow

`RequesterDashboard.tsx` supports:

- request creation
- status summary
- requester confirmation for specification review (`ACCEPT` / `REQUEST_MODIFICATION`)

### Checker flow

`CheckerDashboard.tsx` supports:

- list assigned requests
- submit reviewed specification

### Approver flow

`ApproverDashboard.tsx` supports:

- list pending approvals
- decisions: `APPROVED`, `REJECTED`, `CLARIFICATION_REQUESTED`

### Supply branch flow

`SupplyBranchDashboard.tsx` supports:

- start procurement job from approved request
- assign clerk
- register suppliers
- view job table

### Subject clerk flow

`SubjectClerkDashboard.tsx` supports:

- show assigned jobs
- choose supplier category
- attach suppliers
- generate quotation letters
- view simplified schedule preview

## Adding a New Frontend Feature

Recommended order:

1. Create/update API wrapper under `src/api`
2. Extend model types in `src/types/models.ts`
3. Build role-specific feature component in `src/features`
4. Connect in `RoleWorkspace.tsx` (if role visible)
5. Add any needed constants in `src/config/constants.ts`

## Integration Contract

For exact backend request/response contracts, use:

- [../docs/api-reference.md](../docs/api-reference.md)

For backend business rules and status transitions, use:

- [../Backend/README.md](../Backend/README.md)
