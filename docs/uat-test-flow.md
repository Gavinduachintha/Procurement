# Procurement System UAT Test Flow

Date: 2026-04-08

Execution template:
- [docs/uat-execution-checksheet.md](docs/uat-execution-checksheet.md)

## 1. Goal

Validate the full request-to-payment workflow including stage-2 procurement, while confirming role restrictions and sequence checks.

## 2. Test Environment

- Backend running on localhost:3000
- Frontend running on localhost:5173
- PostgreSQL connected and schema initialized
- All users from docs/manual-test-users.txt registered in the app

## 3. Roles Used

- REQUESTING_OFFICER
- DIRECTOR_ICT (or MAINTENANCE_ENGINEER for NON_IT)
- DEAN, REGISTRAR, BURSAR, VICE_CHANCELLOR (view-only validation)
- SUPPLY_BRANCH
- SUBJECT_CLERK
- MINOR_COMMITTEE or MAJOR_COMMITTEE
- FINANCE_OFFICER

## 4. Golden Path (End-to-End)

### Step 1: Submit Request

Actor: REQUESTING_OFFICER

Actions:
- Login
- Create a new request (recommended: IT item)
- Open request details page

Expected:
- Request is created successfully
- Request status reaches SPEC_REVIEW_PENDING

### Step 2: Review Specifications

Actor: DIRECTOR_ICT (or MAINTENANCE_ENGINEER for NON_IT)

Actions:
- Open specification review list
- Review the request and submit notes

Expected:
- Request status becomes SPEC_RETURNED_TO_REQUESTER

### Step 3: Requester Confirmation

Actor: REQUESTING_OFFICER

Actions:
- Open the same request details
- Click Accept and Continue

Expected:
- Request status becomes APPROVED
- Request is now visible for supply branch procurement start

### Step 4: Approver Roles Are View-Only

Actors: DEAN, REGISTRAR, BURSAR, VICE_CHANCELLOR

Actions:
- Login each role
- Open approvals page

Expected:
- Requests are visible for viewing
- No active approval decision flow is available
- System behavior remains view/notification only

### Step 5: Start Procurement Job and Assign Clerk

Actor: SUPPLY_BRANCH

Actions:
- Open supply branch dashboard
- Start job for approved request by choosing a procurement method
- Assign a SUBJECT_CLERK to the created job

Expected:
- Job is created and visible in dashboard
- Assigned clerk is shown on the job row

### Step 6: Category and Supplier Selection

Actor: SUBJECT_CLERK (or SUPPLY_BRANCH)

Actions:
- Open assigned job
- Select supplier category
- Select suppliers
- Generate quotation letters

Expected:
- Category and suppliers are saved
- Letters generation succeeds

### Step 7: Send to TEC

Actor: SUBJECT_CLERK (assigned) or SUPPLY_BRANCH

Actions:
- Send job to TEC

Expected:
- Job status becomes PENDING_TEC_DECISION

### Step 8: Enter TEC Decisions

Actor: SUBJECT_CLERK (assigned) or SUPPLY_BRANCH

Actions:
- Enter TEC decision rows for suppliers
- Mark at least one supplier as recommended
- Save TEC decisions

Expected:
- TEC decisions are saved
- Committee report is generated
- Committee type is determined (MINOR or MAJOR)
- Job status becomes TEC_DECISION_ENTERED

### Step 9: Route to Committee and Decide

Actors: SUBJECT_CLERK or SUPPLY_BRANCH, then committee role

Actions:
- Route job to committee
- Login as the expected committee role (MINOR_COMMITTEE or MAJOR_COMMITTEE)
- Record committee decision as APPROVED

Expected:
- Job status moves to PENDING_MINOR_COMMITTEE_APPROVAL or PENDING_MAJOR_COMMITTEE_APPROVAL
- After approval, status becomes COMMITTEE_APPROVED

### Step 10: Generate Purchase Orders

Actor: SUPPLY_BRANCH

Actions:
- Generate purchase orders for committee-approved job
- Open purchase order list for the job

Expected:
- Purchase orders are generated
- Job status becomes PURCHASE_ORDER_GENERATED
- Confirmation links/tokens exist for each purchase order

### Step 11: Confirm Delivery via Token Link

Actor: Requesting officer or delivery confirmer

Actions:
- Open delivery confirmation URL from purchase order entry
- Submit delivery confirmation

Expected:
- Delivery confirmation succeeds
- Job status becomes DELIVERED or ACCEPTED

### Step 12: Generate Delivery Note

Actor: SUBJECT_CLERK (assigned) or SUPPLY_BRANCH

Actions:
- Generate delivery note from purchase order

Expected:
- Delivery note is generated successfully
- Action is allowed only after delivery confirmation

### Step 13: Generate Payment Voucher

Actor: SUBJECT_CLERK (assigned), SUPPLY_BRANCH, or FINANCE_OFFICER

Actions:
- Generate payment voucher for purchase order

Expected:
- Payment voucher is generated successfully
- Job status becomes PAYMENT_VOUCHER_GENERATED
- Action is allowed only after delivery note exists

### Step 14: Validate Reports

Actors: SUPPLY_BRANCH, FINANCE_OFFICER, MINOR_COMMITTEE, MAJOR_COMMITTEE

Actions:
- Open quarterly report
- Open annual report

Expected:
- Reports load successfully for allowed roles
- Unauthorized roles do not get access

## 5. Negative Tests (Must Pass)

1. Unassigned subject clerk cannot act on another clerk's job.
2. Delivery note generation fails if delivery is not confirmed.
3. Payment voucher generation fails if delivery note is missing.
4. Wrong committee role cannot submit committee decision.
5. Approver roles cannot perform manual approval decisions.

## 6. Evidence Checklist

For each step capture:
- Screenshot of page state
- Actor role used
- Request ID and Job Number
- Final status shown
- API error message (if negative case)

## 7. Exit Criteria

UAT passes when:
- Golden path completes from request submission to payment voucher
- All negative tests return correct blocking behavior
- No blocker or critical defects remain open
