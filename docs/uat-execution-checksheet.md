# UAT Execution Checksheet

Date: 2026-04-08

## Header

Fill this before running tests.

| Field            | Value                             |
| ---------------- | --------------------------------- |
| Test Cycle       |                                   |
| Environment      | Local / Staging / Production-like |
| Backend Version  |                                   |
| Frontend Version |                                   |
| Tester Name      |                                   |
| Start Time       |                                   |
| End Time         |                                   |

## Status Codes

Use one status per row.

- PASS
- FAIL
- BLOCKED
- NA

## Golden Path Checksheet

Record one evidence item per step (screenshot name, request id, job number, error text).

| Step | Role                                              | Action                                       | Expected Result                                                    | Actual Result | Status | Evidence |
| ---- | ------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ | ------------- | ------ | -------- |
| 1    | REQUESTING_OFFICER                                | Submit new request                           | Request created and moves to SPEC_REVIEW_PENDING                   |               |        |          |
| 2    | DIRECTOR_ICT or MAINTENANCE_ENGINEER              | Review specification                         | Request moves to SPEC_RETURNED_TO_REQUESTER                        |               |        |          |
| 3    | REQUESTING_OFFICER                                | Accept and Continue in request details       | Request moves to APPROVED                                          |               |        |          |
| 4    | DEAN                                              | Open approvals page                          | View-only behavior; no manual decision action                      |               |        |          |
| 5    | REGISTRAR                                         | Open approvals page                          | View-only behavior; no manual decision action                      |               |        |          |
| 6    | BURSAR                                            | Open approvals page                          | View-only behavior; no manual decision action                      |               |        |          |
| 7    | VICE_CHANCELLOR                                   | Open approvals page                          | View-only behavior; no manual decision action                      |               |        |          |
| 8    | SUPPLY_BRANCH                                     | Start procurement job for approved request   | Job created and shown in supply dashboard                          |               |        |          |
| 9    | SUPPLY_BRANCH                                     | Assign subject clerk                         | Assigned clerk is shown on job                                     |               |        |          |
| 10   | SUBJECT_CLERK (assigned)                          | Select category, suppliers, generate letters | Supplier selection and letters saved                               |               |        |          |
| 11   | SUBJECT_CLERK (assigned) or SUPPLY_BRANCH         | Send to TEC and enter TEC decisions          | TEC saved and committee report generated                           |               |        |          |
| 12   | SUBJECT_CLERK (assigned) or SUPPLY_BRANCH         | Route job to committee                       | Status changes to pending correct committee                        |               |        |          |
| 13   | MINOR_COMMITTEE or MAJOR_COMMITTEE                | Submit committee decision APPROVED           | Status changes to COMMITTEE_APPROVED                               |               |        |          |
| 14   | SUPPLY_BRANCH                                     | Generate purchase orders                     | PO records created with confirmation link/token                    |               |        |          |
| 15   | Delivery confirmer                                | Confirm delivery through token link          | Delivery confirmed, status DELIVERED or ACCEPTED                   |               |        |          |
| 16   | SUBJECT_CLERK (assigned) or SUPPLY_BRANCH         | Generate delivery note                       | Allowed only after delivery confirmation                           |               |        |          |
| 17   | SUBJECT_CLERK or SUPPLY_BRANCH or FINANCE_OFFICER | Generate payment voucher                     | Allowed only after delivery note; status PAYMENT_VOUCHER_GENERATED |               |        |          |
| 18   | SUPPLY_BRANCH                                     | Open quarterly and annual reports            | Reports load successfully                                          |               |        |          |
| 19   | FINANCE_OFFICER                                   | Open quarterly and annual reports            | Reports load successfully                                          |               |        |          |
| 20   | MINOR_COMMITTEE or MAJOR_COMMITTEE                | Open quarterly and annual reports            | Reports load successfully                                          |               |        |          |

## Negative Test Checksheet

| Test | Role                                              | Action                                              | Expected Result                              | Actual Result | Status | Evidence |
| ---- | ------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- | ------------- | ------ | -------- |
| N1   | SUBJECT_CLERK (not assigned)                      | Try actions on other clerk job                      | Access blocked with authorization error      |               |        |          |
| N2   | SUBJECT_CLERK or SUPPLY_BRANCH                    | Generate delivery note before delivery confirmation | Action blocked with sequence error           |               |        |          |
| N3   | SUBJECT_CLERK or SUPPLY_BRANCH or FINANCE_OFFICER | Generate payment voucher before delivery note       | Action blocked with sequence error           |               |        |          |
| N4   | Wrong committee role                              | Submit committee decision                           | Access blocked with role error               |               |        |          |
| N5   | DEAN/REGISTRAR/BURSAR/VICE_CHANCELLOR             | Attempt manual approval decision                    | Manual approval blocked (view-only behavior) |               |        |          |

## Defect Log

| Defect ID | Severity                       | Step/Test Ref | Summary | Repro Steps | Expected | Actual | Owner | Status                              |
| --------- | ------------------------------ | ------------- | ------- | ----------- | -------- | ------ | ----- | ----------------------------------- |
|           | Critical / High / Medium / Low |               |         |             |          |        |       | Open / In Progress / Fixed / Retest |

## Sign-off

| Check                            | Result   |
| -------------------------------- | -------- |
| Golden path completed end-to-end |          |
| All negative tests validated     |          |
| No open blocker defects          |          |
| Ready for next stage             | Yes / No |
