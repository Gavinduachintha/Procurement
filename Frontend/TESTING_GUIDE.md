# Frontend Testing Guide

Complete guide for testing the Procurement System frontend with all the comprehensive logging now in place.

## Setup

### 1. Start Backend Server

```bash
cd Backend
npm install  # if not already done
npm start
```

Backend should be running on `http://localhost:3000`

### 2. Start Frontend Dev Server

```bash
cd Frontend
npm install  # if not already done
npm run dev
```

Frontend should be running on `http://localhost:5173`

### 3. Open in Browser

- Go to http://localhost:5173
- Open DevTools (F12)
- Go to Console tab
- You're ready to test!

## Test Users

From `docs/manual-test-users.txt`, you have test accounts for each role:

| Role                 | Email                 | Password    |
| -------------------- | --------------------- | ----------- |
| REQUESTING_OFFICER   | requester@example.com | password123 |
| DIRECTOR_ICT         | director@example.com  | password123 |
| MAINTENANCE_ENGINEER | engineer@example.com  | password123 |
| DEAN                 | dean@example.com      | password123 |
| REGISTRAR            | registrar@example.com | password123 |
| BURSAR               | bursar@example.com    | password123 |
| VICE_CHANCELLOR      | vc@example.com        | password123 |
| SUPPLY_BRANCH        | supply@example.com    | password123 |
| SUBJECT_CLERK        | clerk@example.com     | password123 |

## Test Scenarios

### Scenario 1: Complete Request Submission Workflow

**Role**: REQUESTING_OFFICER

**Steps**:

1. [ ] Open console, clear logs
2. [ ] Login with `requester@example.com` / `password123`
3. [ ] Observe logs:
   - `🔐 Login.jsx: Login attempt`
   - `✅ Login.jsx: Login successful`
   - `💾 Login.jsx: Token and user data stored`
4. [ ] Click "Submit Request" in menu
5. [ ] Fill form:
   - Item Name: "Dell Laptop"
   - Item Type: "IT Equipment" (this is "IT" value)
   - Description: "High-performance laptop for development"
   - Specifications: "16GB RAM, 512GB SSD, Windows 11"
   - Quantity: 5
   - Cost: 50000
   - Funding: "MPP"
   - Justification: "Needed for development team"
   - Department: "ICT"
   - Date: Pick future date
6. [ ] Submit form
7. [ ] Observe logs:
   - `📝 RequestSubmission.jsx: Form submitted`
   - `✅ RequestSubmission.jsx: ItemType validated: IT`
   - `📤 RequestSubmission.jsx: Sending request payload`
   - Should see `itemType: "IT"` in payload
   - `✅ RequestSubmission.jsx: Request created successfully`
8. [ ] Verify redirected to request details page
9. [ ] Request details page logs should show:
   - `📄 RequestDetails.jsx: Mounted with request ID: X`
   - Request data displayed

**Expected Result**: ✅ Form submits, request created, redirected to details page

**Logs to Check**:

- [ ] `✅ Login successful` (authentication working)
- [ ] `✅ ItemType validated: IT` (form validation working)
- [ ] `📤` payload has `itemType: "IT"` (correct field value)
- [ ] `✅ Request created successfully` (API call succeeded)

---

### Scenario 2: Requesting Officer Dashboard

**Role**: REQUESTING_OFFICER

**Steps**:

1. [ ] Login as `requester@example.com`
2. [ ] Go to Dashboard (click "Dashboard" in menu)
3. [ ] Observe logs:
   - `📊 Dashboard.jsx: Component mounted for role: REQUESTING_OFFICER`
   - `🔄 Dashboard.jsx: Selected endpoint: /requests/mine`
   - `📤 Request: GET http://localhost:3000/api/requests/mine`
   - `📥 Response: 200`
   - `✅ Dashboard.jsx: Loaded X items for REQUESTING_OFFICER`
4. [ ] Should see list of their requests

**Expected Result**: ✅ Dashboard shows their requests

**Logs to Check**:

- [ ] Role is `REQUESTING_OFFICER`
- [ ] Endpoint is `/requests/mine`
- [ ] Response status is 200
- [ ] Item count is > 0 (if requests exist)

---

### Scenario 3: Director ICT Specification Review

**Role**: DIRECTOR_ICT

**Steps**:

1. [ ] Clear logs, login as `director@example.com`
2. [ ] Observe `✅ App.jsx: Session found, user: { role: "DIRECTOR_ICT" }`
3. [ ] Click "Spec Review" in menu
4. [ ] Observe logs:
   - `🔍 SpecificationReview.jsx: Mounted with role: DIRECTOR_ICT`
   - `🔄 SpecificationReview.jsx: Fetching specifications`
   - `📥 Response: 200`
   - `✅ SpecificationReview.jsx: Found X specifications to review`
5. [ ] If specifications exist, click "Review" button
6. [ ] Modal opens, enter review notes
7. [ ] Click "Submit Review"
8. [ ] Observe logs:
   - `👁️ SpecificationReview.jsx: Opening review modal for spec ID: X`
   - `📤 SpecificationReview.jsx: Submitting review`
   - `📋 SpecificationReview.jsx: Review payload`
   - Should see the notes in payload
   - `✅ SpecificationReview.jsx: Review submitted successfully`

**Expected Result**: ✅ Can review specifications

**Logs to Check**:

- [ ] Endpoint is `/requests/assigned/specification`
- [ ] Specifications count > 0
- [ ] Review payload has notes field
- [ ] Success message appears

---

### Scenario 4: Dean Approval Dashboard

**Role**: DEAN

**Steps**:

1. [ ] Clear logs, login as `dean@example.com`
2. [ ] Click "Approvals" in menu
3. [ ] Observe logs:
   - `✅ ApprovalDashboard.jsx: Mounted with role: DEAN`
   - `🔄 ApprovalDashboard.jsx: Fetching approvals from /approvals/mine/pending`
   - `📥 Response: 200`
   - `📦 ApprovalDashboard.jsx: API response has X approvals`
4. [ ] If approvals exist, click "Approve" button
5. [ ] Modal opens with decision options
6. [ ] Select "APPROVE" action
7. [ ] Click "Submit Decision"
8. [ ] Observe logs:
   - `📋 ApprovalDashboard.jsx: Opening approval modal with action: APPROVE`
   - `📤 ApprovalDashboard.jsx: Submitting decision`
   - `📋 Decision payload: { action: "APPROVE" }`
   - `✅ ApprovalDashboard.jsx: Decision submitted successfully`

**Expected Result**: ✅ Can approve requests

**Logs to Check**:

- [ ] Endpoint is `/approvals/mine/pending`
- [ ] Approvals count > 0
- [ ] Decision payload has action field
- [ ] Success message appears

---

### Scenario 5: Supply Branch Procurement

**Role**: SUPPLY_BRANCH

**Steps**:

1. [ ] Clear logs, login as `supply@example.com`
2. [ ] Click "Procurement" in menu
3. [ ] Observe logs:
   - `🏭 SupplyBranchDashboard.jsx: Mounted with role: SUPPLY_BRANCH`
   - `🔄 SupplyBranchDashboard.jsx: Fetching approved jobs without methods`
   - `📥 Response: 200`
   - `✅ SupplyBranchDashboard.jsx: Found X jobs`
4. [ ] If jobs exist, for first job:
   - Select method from dropdown (e.g., "SQ")
   - Observe: `🔧 SupplyBranchDashboard.jsx: Method selected for job X: SQ`
   - Click "Submit Method"
   - Observe: `📤 Submitting method: { job_id: X, method: "SQ" }`
   - `✅ Method submitted successfully`
5. [ ] For supplier selection:
   - Click on a job card
   - Select category dropdown
   - Observe: `📦 Fetching suppliers for category: IT_EQUIPMENT`
   - `✅ Received X suppliers from category`
   - Check supplier checkboxes
   - Observe: `✓ Supplier toggle - ID: X, Selected: true`
   - Click "Submit Suppliers"
   - Observe: `📋 Supplier payload with 3 selected`

**Expected Result**: ✅ Can select methods and suppliers

**Logs to Check**:

- [ ] Endpoint is `/requests/approved/without-jobs`
- [ ] Jobs count > 0
- [ ] Method submission has correct job_id and method
- [ ] Suppliers are fetched by category
- [ ] Supplier toggles work

---

### Scenario 6: Login and Session Persistence

**Steps**:

1. [ ] Clear logs, refresh page
2. [ ] Observe `🚀 App.jsx: Component mounted, checking for existing session`
3. [ ] Login with any credentials
4. [ ] Observe all login logs
5. [ ] Refresh page (F5)
6. [ ] Observe logs:
   - `🚀 App.jsx: Component mounted, checking for existing session`
   - `✅ App.jsx: Session found, user: { ... }`
   - Should NOT see login page
7. [ ] Click logout
8. [ ] Observe:
   - `🚪 Layout.jsx: Logout initiated for user: X`
   - `✅ Layout.jsx: Session cleared from localStorage`
   - `🎯 Layout.jsx: Navigating to login page`
9. [ ] Should be at login page
10. [ ] Refresh page
11. [ ] Observe:
    - `🚀 App.jsx: Component mounted, checking for existing session`
    - `⚠️ App.jsx: No session found, user will be redirected to login`

**Expected Result**: ✅ Session persists, logout clears session

**Logs to Check**:

- [ ] Session found after refresh
- [ ] Session cleared after logout
- [ ] Logout navigates to login

---

## API Response Verification

### Testing Dashboard Data Extraction

The dashboard handles multiple response formats. Test that it works with your backend:

**In Dashboard.jsx logs, look for:**

```
📦 Dashboard.jsx: Raw API response: {...}
📋 Dashboard.jsx: Data extraction: Found X items in .data property
```

**If you see this instead:**

```
📋 Dashboard.jsx: Data extraction: Response is direct array with X items
```

This means backend returns array directly (not wrapped).

**If you see:**

```
📋 Dashboard.jsx: Data extraction: Found X items in .requests property
📋 Dashboard.jsx: Data extraction: Found X items in .items property
```

Backend has different data structure. The code handles it, but verify it's correct.

---

## Performance Observation

With the comprehensive logging, you can observe:

1. **API Response Times**:
   - Login request: Should be < 500ms
   - Data fetches: Should be < 1s
   - Form submissions: Should be < 1s

2. **Network Tab**:
   - Check actual response times
   - Look for slow endpoints
   - Check if requests are cached

3. **Console Logs**:
   - Should be in immediate sequence
   - No unexplained gaps = no latency issues

---

## Error Scenarios

### Test Error Handling

**1. Network Error (Backend Down)**:

- [ ] Stop backend server
- [ ] Try to login
- [ ] Should see `❌` error in logs with status
- [ ] Should show "Connection failed" error message

**2. Invalid Credentials**:

- [ ] Login with wrong password
- [ ] Should see `❌ Login.jsx: ERROR` log
- [ ] Should show "Invalid credentials" error

**3. Unauthorized (Token Expired)**:

- [ ] Clear localStorage manually
- [ ] Refresh page while "logged in" state
- [ ] Page should redirect to login
- [ ] `⚠️ App.jsx: No session found`

**4. Bad Form Data**:

- [ ] Try to submit form without required field
- [ ] Browser validation should prevent submit
- [ ] Try to submit form with itemType missing
- [ ] Should see `❌ ItemType validation failed`

---

## Data Integrity Checks

### Verify Correct Data in Requests

**Check Request Submission Payload**:

1. Open RequestSubmission form
2. Fill in all fields
3. In Console, look for `📤 RequestSubmission.jsx: Sending request payload:`
4. Verify:
   - [ ] `itemType` is "IT" or "NON_IT" (not other values)
   - [ ] `quantity` and `estimated_cost` are numbers (not strings)
   - [ ] `funding_source` matches backend expectations
   - [ ] All dates are in ISO format
   - [ ] No undefined values

**Check Approval Decision Payload**:

1. Go to Approval Dashboard
2. Click approve on an item
3. In Console, look for `📋 Decision payload:`
4. Verify:
   - [ ] `action` is "APPROVE", "REJECT", or "CLARIFICATION"
   - [ ] `approval_id` is present and correct

**Check Supplier Submission Payload**:

1. Go to Supply Branch Dashboard
2. Select suppliers
3. In Console, look for `📋 Supplier payload:`
4. Verify:
   - [ ] `job_id` is present
   - [ ] `supplier_ids` is array of numbers
   - [ ] All selected suppliers are in array

---

## Logging Best Practices During Testing

### Clear and Fresh Testing

1. Before each test scenario:
   ```
   1. Clear logs (🚫 button in Console)
   2. Note the time
   3. Perform action
   4. Review logs
   5. Take notes/screenshot
   ```

### Systematic Testing

1. Test one scenario at a time
2. Document expected vs actual behavior
3. Check every log line for errors (look for ❌)
4. Verify data matches expectations
5. Check Network tab for request/response

### Debugging Failed Tests

1. Find the `❌` error log
2. Read the error message carefully
3. Look at logs BEFORE the error for context
4. Check Network tab for actual request/response
5. Compare with expected format in documentation

---

## Test Completion Checklist

After testing all scenarios, verify:

- [ ] Login works with valid credentials
- [ ] Requesting officer can submit requests with itemType
- [ ] Dashboard shows correct role-based data
- [ ] Specification review works for IT roles
- [ ] Approvals workflow works for approvers
- [ ] Supply branch can select methods and suppliers
- [ ] Session persists after refresh
- [ ] Logout clears session
- [ ] All error messages are clear
- [ ] All API calls have correct endpoints
- [ ] All payloads have correct data types
- [ ] Logging is comprehensive and helpful
- [ ] No ❌ errors in normal workflow
- [ ] Performance is acceptable (< 2s for all operations)

---

## Known Limitations

Currently testing features:

- ✅ Authentication (Login/Logout)
- ✅ Dashboard (Role-based data)
- ✅ Request Submission (with itemType field)
- ✅ Specification Review
- ✅ Approval Workflow
- ✅ Procurement Management

Features still being developed:

- Request Details confirmation actions
- Full pagination (if backend uses it)
- Advanced filtering/search
- Export/reporting

---

## Quick Test Command Sequence

If you want to run through everything quickly:

```bash
# Terminal 1: Backend
cd Backend
npm start

# Terminal 2: Frontend
cd Frontend
npm run dev

# Browser: http://localhost:5173
# DevTools: F12 → Console

# Test sequence (each about 2-3 minutes):
1. Test login (requester@example.com)
2. Test request submission
3. Test logout
4. Test login as director
5. Test spec review
6. Test login as dean
7. Test approvals
8. Test login as supply
9. Test procurement
```

Total time: ~20 minutes for complete workflow test

---

## Reporting Test Results

If you find issues, record:

1. **Test Scenario**: Which role/action
2. **Expected**: What should have happened
3. **Actual**: What actually happened
4. **Console Logs**: Screenshot of ❌ error (Ctrl+A to select all, copy)
5. **Network Tab**: Screenshot of failed request (show URL, method, status)
6. **Steps to Reproduce**: Exact steps taken
7. **Browser/OS**: Chrome/Firefox/Safari, Windows/Mac/Linux

This helps debug much faster!

---

**Happy testing! The comprehensive logging should make it easy to see exactly what's happening at each step.**
