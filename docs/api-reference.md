# API Reference

Base URL pattern:

- Local default: `http://localhost:3000/api`

Health check:

- `GET /health`

Auth:

- Protected endpoints require header `Authorization: Bearer <token>`.

---

## 1) Authentication

### POST /auth/register

Creates user and returns token.

Request body:

- `fullName` (string, required)
- `email` (string, required)
- `password` (string, required)
- `role` (string, required)
- `department` (string, optional)

Response:

- `user`
- `token`

### POST /auth/login

Request body:

- `email`
- `password`

Response:

- `user`
- `token`

### GET /auth/me

Returns current authenticated user.

### GET /auth/users?role=<ROLE>

Returns users for role.

Errors:

- `400` if `role` query missing

---

## 2) Requests

### POST /requests

Create purchase request (requesting officer only).

Request body:

- `itemName`
- `itemDescription` (optional)
- `technicalSpecifications`
- `itemType` (`IT` or `NON_IT`)
- `quantity`
- `estimatedCost`
- `fundingSource` (`MPP` | `SELF_FUND` | `SPECIAL_FUND`)
- `justification`
- `department`
- `requiredDate` (ISO date)
- `attachments` (array of strings)

Response:

- created request row

### GET /requests/mine

Returns requester-owned requests.

### GET /requests/assigned/specification

Returns requests assigned to checker where status is:

- `SPEC_REVIEW_PENDING`
- `SPEC_REWORK_REQUESTED`

### GET /requests/approved/without-jobs

Returns approved requests not yet turned into procurement jobs.

### GET /requests/:id

Returns request by numeric DB id.

---

## 3) Specification

### POST /specifications/:requestId/review

Checker submits reviewed specs.

Request body:

- `reviewedSpecifications` (required)
- `reviewNotes` (optional)

Rules:

- only checker roles
- checker must be assigned for request
- request must be in review state

### POST /specifications/:requestId/requester-confirmation

Requester confirms reviewed specification.

Request body:

- `action`: `ACCEPT` or `REQUEST_MODIFICATION`

Effects:

- `ACCEPT` -> `APPROVAL_PENDING`
- `REQUEST_MODIFICATION` -> `SPEC_REWORK_REQUESTED`

---

## 4) Approvals

### GET /approvals/mine/pending

Returns requests where this approver still has `PENDING` decision.

### POST /approvals/:requestId/decision

Request body:

- `decision`: `APPROVED` | `REJECTED` | `CLARIFICATION_REQUESTED`
- `comments` (optional)

Response includes:

- `request`
- `approval`
- `summary`

Summary fields:

- `approved_count`
- `rejected_count`
- `clarification_count`
- `pending_count`
- `total_count`

---

## 5) Procurement

### POST /procurement/suppliers

Creates supplier (supply branch only).

Request body:

- `name`
- `email`
- `category`

### GET /procurement/suppliers

Lists all suppliers (supply branch only).

### POST /procurement/requests/:requestId/start

Starts procurement for approved request and generates job.

Request body:

- `procurementMethod`

Allowed methods:

- `SQ`, `HQ`, `ICB`, `LIB`, `LNB`, `NCB`, `NATIONAL_SHOPPING`

Response:

- job row including `job_number`

### POST /procurement/jobs/:jobId/assign-clerk

Assigns clerk to job.

Request body:

- `clerkId`

### POST /procurement/jobs/:jobId/select-category

Sets job supplier category and returns suppliers in that category.

Request body:

- `category`

Allowed roles:

- supply branch
- assigned subject clerk

### POST /procurement/jobs/:jobId/select-suppliers

Attaches suppliers to job.

Request body:

- `supplierIds` (number[])

### POST /procurement/jobs/:jobId/generate-letters

Creates/updates quotation letters per selected supplier.

Request body:

- `submissionDeadline` (ISO date)

Response:

- `jobNumber`
- `letterContent`
- `recipients`

### GET /procurement/jobs/:jobId/schedule

Returns schedule view:

- job metadata
- row per selected supplier
- quotation/evaluation fields

---

## 6) Dashboards / Notifications

### GET /dashboard/requester

Returns grouped counts by request status for current requester.

### GET /dashboard/approver

Returns grouped counts by decision for current approver.

### GET /dashboard/supply-branch

Returns supply branch job list view.

### GET /dashboard/notifications

Returns current user notifications ordered by newest first.

---

## Error Response Contract

For known business rule failures:

```json
{ "message": "..." }
```

HTTP status examples:

- `400` invalid input/state
- `401` missing or invalid token
- `403` forbidden by role or assignment
- `404` not found
- `409` conflict (example: duplicate job for request)
- `500` unexpected server error
