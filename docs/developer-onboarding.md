# Developer Onboarding Checklist

Use this checklist for new maintainers.

## Day 1 Setup

1. Read [system-overview.md](system-overview.md)
2. Read backend guide [../Backend/README.md](../Backend/README.md)
3. Read frontend guide [../Frontend/README.md](../Frontend/README.md)
4. Review API contract [api-reference.md](api-reference.md)
5. Configure local environment variables for backend and frontend
6. Run backend and frontend locally
7. Verify login, request submission, and one approval cycle

## Understand the Critical Flow

Follow this sequence using test users:

1. Register/login as requester
2. Submit request
3. Login as checker and review
4. Login as requester and confirm
5. Login as approver and decide
6. Login as supply branch and generate job
7. Login as subject clerk and select suppliers + letters

## Before Changing Code

- Identify which layer is affected:
  - backend service logic
  - API contract
  - frontend feature
  - DB schema
- Search for status and role constants before introducing new values
- Confirm endpoint impact on frontend `src/api/*`

## Pull Request Readiness

A PR is ready when:

- behavior is tested manually
- API and docs are updated
- no unrelated refactors included
- role permissions still enforced

## Handover Note Template

Every release should include:

- what changed
- affected roles
- affected endpoints
- DB changes (if any)
- rollback considerations
- docs updated (yes/no)
