# Frontend Logging Guide

## Overview

The frontend application includes comprehensive logging throughout all major components and pages to aid in debugging and understanding the application flow. All logs are printed to the browser console.

## How to View Logs

1. **Open Browser Developer Tools**: Press `F12` or Right-click → "Inspect"
2. **Go to Console Tab**: Click on "Console" tab
3. **Clear Console**: Click the 🚫 button to clear old logs
4. **Perform Actions**: Login, navigate, submit forms, etc.
5. **Observe Logs**: Watch the logs appear with emoji prefixes for easy scanning

## Logging Locations

### 🌐 API Client (`src/api/client.js`)

Logs all HTTP requests and responses.

**What's Logged:**

- 🌐 Axios instance initialization (base URL)
- 📤 **Request Details**: Method, URL, request data (if any), authentication status
- 📥 **Response Details**: Status code, URL, response data length
- ❌ **Error Details**: Status code, URL, error message, full error object

**Example Console Output:**

```
🌐 Axios initialized with base URL: http://localhost:3000/api
📤 Request: POST http://localhost:3000/api/auth/login { email: "user@example.com" } | Auth: true
📥 Response: 200 from POST http://localhost:3000/api/auth/login | Data length: 245
```

### 🔐 Login Page (`src/pages/Login.jsx`)

Logs all authentication flow events.

**What's Logged:**

- 🔐 Login attempt with email
- 📝 Request being sent
- ✅ Successful login with user ID and role
- 💾 Token and user data stored in localStorage
- 🎯 Navigation to dashboard
- ❌ Login failure with error message

**Example Console Output:**

```
🔐 Login.jsx: Login attempt with email: user@example.com
📝 Login.jsx: Sending login request...
✅ Login.jsx: Login successful! User ID: 1, Role: REQUESTING_OFFICER
💾 Login.jsx: Token and user data stored in localStorage
🎯 Login.jsx: Navigating to /dashboard
```

### 📊 Dashboard (`src/pages/Dashboard.jsx`)

Logs role-based data loading and endpoint selection.

**What's Logged:**

- 📊 Component mount with user role
- 🔄 Endpoint selected based on role
- 📦 Raw API response received
- 📋 Data extraction and type detection
- ✅ Final data set with item count
- ❌ Fetch errors with status code and details

**Role → Endpoint Mapping:**

- `REQUESTING_OFFICER` → `/requests/mine`
- `DEAN, REGISTRAR, BURSAR, VICE_CHANCELLOR` → `/approvals/mine/pending`
- `DIRECTOR_ICT, MAINTENANCE_ENGINEER` → `/requests/assigned/specification`
- `SUPPLY_BRANCH, SUBJECT_CLERK` → `/requests/approved/without-jobs`

**Example Console Output:**

```
📊 Dashboard.jsx: Component mounted for role: REQUESTING_OFFICER
🔄 Dashboard.jsx: Selected endpoint: /requests/mine
📤 Dashboard.jsx: Fetching data from: http://localhost:3000/api/requests/mine
📦 Dashboard.jsx: Raw API response: { data: [...], metadata: {...} }
📋 Dashboard.jsx: Data extraction: Found 5 requests in .data property
✅ Dashboard.jsx: Loaded 5 items for REQUESTING_OFFICER
```

### 📝 Request Submission (`src/pages/RequestSubmission.jsx`)

Logs form submission and validation.

**What's Logged:**

- 📝 Form submission initiated
- 📋 Complete form data dump
- ❌ ItemType validation failures (if any)
- 📤 Request payload before API call
- ✅ Successful request creation with redirect
- ❌ Submission errors with details

**Example Console Output:**

```
📝 RequestSubmission.jsx: Form submitted
📋 RequestSubmission.jsx: Form data: { item_name: "Laptop", itemType: "IT", quantity: 5, ... }
✅ RequestSubmission.jsx: ItemType validated: IT
📤 RequestSubmission.jsx: Sending request payload: { item_name: "Laptop", itemType: "IT", ... }
✅ RequestSubmission.jsx: Request created successfully! Redirecting to /request/1
```

### 📄 Request Details (`src/pages/RequestDetails.jsx`)

Logs request data loading and confirmation actions.

**What's Logged:**

- 📄 Component mount with request ID
- 🔄 Fetch operation for request details
- ✅ Loaded request data summary (ID, status, item, requester)
- 🔐 Confirmation action being processed
- 📤 Confirmation request payload
- ❌ Confirmation failure details

**Example Console Output:**

```
📄 RequestDetails.jsx: Mounted with request ID: 1
🔄 RequestDetails.jsx: Fetching request details from /requests/1
✅ RequestDetails.jsx: Loaded request 1: Status=SPEC_CHECKED, Item=Laptop, Requester=user@example.com
🔐 RequestDetails.jsx: Confirming specification (action: ACCEPT)
📤 RequestDetails.jsx: Sending confirmation payload: { action: "ACCEPT" }
✅ RequestDetails.jsx: Confirmation successful!
```

### 👁️ Specification Review (`src/pages/SpecificationReview.jsx`)

Logs specification review workflow.

**What's Logged:**

- 🔍 Component mount with user role
- 🔄 Fetch operation for specifications to review
- 📦 Raw API response data
- ✅ Count of specifications available for review
- 👁️ Review modal opened with specification ID
- 📤 Review submission with notes
- ❌ Review submission errors

**Example Console Output:**

```
🔍 SpecificationReview.jsx: Mounted with role: DIRECTOR_ICT
🔄 SpecificationReview.jsx: Fetching specifications from /requests/assigned/specification
✅ SpecificationReview.jsx: Found 3 specifications to review
👁️ SpecificationReview.jsx: Opening review modal for spec ID: 1
📤 SpecificationReview.jsx: Submitting review: { notes: "Approved as per requirements" }
✅ SpecificationReview.jsx: Review submitted successfully!
```

### ✅ Approval Dashboard (`src/pages/ApprovalDashboard.jsx`)

Logs approval workflow and decisions.

**What's Logged:**

- ✅ Component mount with user role
- 🔄 Fetch operation for pending approvals
- 📦 Data structure detection and item count
- 📋 Modal opened with action type
- 📤 Decision submission with action (APPROVE/REJECT/CLARIFICATION)
- 📋 Complete decision payload
- ❌ Decision submission errors

**Example Console Output:**

```
✅ ApprovalDashboard.jsx: Mounted with role: DEAN
🔄 ApprovalDashboard.jsx: Fetching approvals from /approvals/mine/pending
📦 ApprovalDashboard.jsx: API response has 2 approvals
📋 ApprovalDashboard.jsx: Opening approval modal with action: APPROVE
📤 ApprovalDashboard.jsx: Submitting decision: { action: "APPROVE" }
✅ ApprovalDashboard.jsx: Decision submitted successfully!
❌ ApprovalDashboard.jsx: Decision submission error: 400 - Invalid approval ID
```

### 🏭 Supply Branch Dashboard (`src/pages/SupplyBranchDashboard.jsx`)

Logs procurement workflow, method selection, and supplier management.

**What's Logged:**

- 🏭 Component mount with user role
- 🔄 Fetch operation for jobs without procurement methods
- 📦 Data structure detection and job count
- 🔧 Method selection (SQ, HQ, ICB, LIB, LNB, NCB, NATIONAL_SHOPPING)
- 📦 Supplier data fetch for selected category
- ✓ Supplier toggle actions (selected/deselected)
- 📤 Method submission with job ID
- 📋 Supplier submission with selected count
- ❌ Operation errors with context

**Example Console Output:**

```
🏭 SupplyBranchDashboard.jsx: Mounted with role: SUPPLY_BRANCH
🔄 SupplyBranchDashboard.jsx: Fetching approved jobs without methods
✅ SupplyBranchDashboard.jsx: Found 4 jobs
🔧 SupplyBranchDashboard.jsx: Method selected for job 5: SQ
📦 SupplyBranchDashboard.jsx: Fetching suppliers for category: IT_EQUIPMENT
✅ SupplyBranchDashboard.jsx: Received 6 suppliers from category IT_EQUIPMENT
✓ SupplyBranchDashboard.jsx: Supplier toggle - ID: 3, Selected: true
📤 SupplyBranchDashboard.jsx: Submitting method: { job_id: 5, method: "SQ" }
✅ SupplyBranchDashboard.jsx: Method submitted successfully!
```

### 🚀 App Component (`src/App.jsx`)

Logs application initialization and session restoration.

**What's Logged:**

- 🚀 App initialization and session check
- ✅ Existing session found with user details
- ⚠️ No session found (redirecting to login)

**Example Console Output:**

```
🚀 App.jsx: Component mounted, checking for existing session...
✅ App.jsx: Session found, user: { id: 1, name: "John Doe", role: "REQUESTING_OFFICER" }
```

### 🔗 Navigation Component (`src/components/Navigation.jsx`)

Logs navigation menu building based on user role.

**What's Logged:**

- 🔗 Navigation links being built for role
- ✅ Count of navigation links created

### 🚪 Layout Component (`src/components/Layout.jsx`)

Logs logout actions.

**What's Logged:**

- 🚪 Logout initiated with user ID
- ✅ Session cleared from localStorage
- 🎯 Navigation to login page

**Example Console Output:**

```
🚪 Layout.jsx: Logout initiated for user: 1
✅ Layout.jsx: Session cleared from localStorage
🎯 Layout.jsx: Navigating to login page
```

## Common Issues and How to Debug Using Logs

### Issue: "Invalid item type. Use IT or NON_IT"

**What to look for in logs:**

1. Check `RequestSubmission.jsx` logs for `ItemType validation` line
2. Look for the actual value sent in `RequestSubmission.jsx: Sending request payload`
3. Should see `itemType: "IT"` or `itemType: "NON_IT"` in the payload

### Issue: Dashboard shows no data

**What to look for in logs:**

1. Check `Dashboard.jsx` - which endpoint was selected? Is it correct for the user role?
2. Look for API response - does it contain data?
3. Check data extraction log - what property had the data? (`.data`, `.requests`, `.items`, or direct array)

### Issue: Login fails

**What to look for in logs:**

1. Check `Login.jsx` logs for login attempt with email
2. Look for API response status code in `api/client.js` logs
3. Check error message in `Login.jsx: Login failure` line

### Issue: API calls failing with 404

**What to look for in logs:**

1. Check `api/client.js` for the exact URL being called
2. Compare with backend routes documentation
3. Verify user role is correct in Dashboard/Page logs

## Log Filtering Tips

### Filter by Component

Press Ctrl+F in Console and search for component name:

- `Dashboard.jsx:` - Filter Dashboard logs only
- `Login.jsx:` - Filter Login logs only
- `RequestSubmission.jsx:` - Filter form logs only

### Filter by Action

Search for emoji prefixes:

- `❌` - Find all errors
- `✅` - Find all successes
- `📤` - Find all outgoing requests
- `📥` - Find all incoming responses

### Filter by Keyword

Search for:

- `error` - All errors
- `payload` - All request payloads
- `response` - All responses
- `status` - All HTTP status codes

## Performance Note

The logging is designed to be minimal and should not significantly impact performance. However, if you have a very large dataset being logged, you can disable specific logs by commenting out the `console.log` statements in the respective files.

## Quick Reference: Emoji Guide

| Emoji | Meaning            | Color  | Usage                 |
| ----- | ------------------ | ------ | --------------------- |
| 🚀    | Launch/Start       | -      | Application startup   |
| 🔐    | Security/Auth      | -      | Login and auth flows  |
| 📝    | Note/Form          | -      | Form interactions     |
| 💾    | Save               | -      | Data persistence      |
| ✅    | Success            | Green  | Successful operations |
| ❌    | Error              | Red    | Failed operations     |
| ⚠️    | Warning            | Yellow | Warnings/Cautions     |
| 📤    | Send/Upload        | -      | Outgoing requests     |
| 📥    | Receive/Download   | -      | Incoming responses    |
| 📊    | Data/Chart         | -      | Data operations       |
| 🔄    | Refresh/Reload     | -      | Loading data          |
| 📦    | Package/Data       | -      | Data structures       |
| 📋    | List/Details       | -      | List operations       |
| 🔍    | Search/Find        | -      | Finding items         |
| 👁️    | View/Watch         | -      | Viewing content       |
| 🏭    | Factory/Processing | -      | Complex operations    |
| ✓     | Check/Toggle       | -      | Selections            |
| 🔧    | Settings/Config    | -      | Configuration         |
| 🏷️    | Label/Tag          | -      | Categories/Tags       |
| 🎯    | Target/Navigate    | -      | Navigation            |
| 🚪    | Exit/Logout        | -      | Logout                |
| 🔗    | Link/Menu          | -      | Navigation menu       |
| 🌐    | Network/Web        | -      | API/Network           |

## Example Debug Session

**Scenario**: User logs in and dashboard shows no data.

**Steps**:

1. Open DevTools Console (F12 → Console tab)
2. Clear console
3. Login with credentials
4. Observe logs:
   ```
   🔐 Login.jsx: Login attempt with email: user@example.com
   📤 Request: POST /auth/login
   📥 Response: 200
   ✅ Login.jsx: Login successful!
   ```
5. Wait for dashboard to load, observe:
   ```
   📊 Dashboard.jsx: Component mounted for role: REQUESTING_OFFICER
   🔄 Dashboard.jsx: Selected endpoint: /requests/mine
   📤 Request: GET /requests/mine
   📥 Response: 200
   📦 Dashboard.jsx: Raw API response: {...}
   ❌ Dashboard.jsx: ERROR - No data found in response!
   ```
6. Check the response object - see what properties it has
7. Verify backend endpoint is returning data
8. Update Dashboard.jsx data extraction logic if needed

---

**Happy debugging! The comprehensive logs should help you understand exactly what's happening at each step of the application.**
