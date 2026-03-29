# Quick Debugging Checklist

Use this checklist when troubleshooting issues in the Procurement System frontend.

## Before You Start

- [ ] Open Developer Tools (F12)
- [ ] Go to Console tab
- [ ] Clear any previous logs (🚫 button)
- [ ] Open Network tab to monitor API calls

## Authentication Issues

### Login Page Won't Load

- [ ] Check `App.jsx` logs - is session check working?
- [ ] Check Network tab - are there any failed requests?
- [ ] Verify backend is running on http://localhost:3000

### Login Fails with Error

- [ ] Look for `❌ Login.jsx` error logs
- [ ] Check `📥 Response:` status code (should be 200)
- [ ] Verify email format is correct
- [ ] Check backend `/auth/login` endpoint is working

### Logged in but Still Redirected to Login

- [ ] Check `✅ Login.jsx: Login successful` log
- [ ] Check `💾 Login.jsx` localStorage logs
- [ ] Verify token is saved: Open DevTools → Application → localStorage → token value
- [ ] Verify user data is saved: Check `user` value in localStorage

## Dashboard Issues

### Dashboard Shows No Data

- [ ] Check `📊 Dashboard.jsx: Component mounted` log
- [ ] Check `🔄 Dashboard.jsx: Selected endpoint:` - is it correct for your role?
  - REQUESTING_OFFICER → `/requests/mine`
  - DEAN/REGISTRAR/BURSAR/VICE_CHANCELLOR → `/approvals/mine/pending`
  - DIRECTOR_ICT/MAINTENANCE_ENGINEER → `/requests/assigned/specification`
  - SUPPLY_BRANCH/SUBJECT_CLERK → `/requests/approved/without-jobs`
- [ ] Look for `📦 Dashboard.jsx: Raw API response:` - does it have data?
- [ ] Check `📋 Dashboard.jsx: Data extraction:` - what property had data?
- [ ] Look for `❌` error logs - any fetch errors?

### Wrong Data Showing

- [ ] Verify user role in logs: `📊 Dashboard.jsx: Component mounted for role: XXXX`
- [ ] Check endpoint selection: `🔄 Dashboard.jsx: Selected endpoint:`
- [ ] Verify backend is returning correct data for that user role

### Loading Spinner Never Disappears

- [ ] Check Network tab - is the API request pending?
- [ ] Look for `❌ Dashboard.jsx: ERROR` logs
- [ ] Check backend server console for errors
- [ ] Try refreshing the page

## Form Submission Issues

### "Invalid item type. Use IT or NON_IT"

- [ ] Look for `❌ RequestSubmission.jsx: ItemType validation failed` log
- [ ] Check `📋 RequestSubmission.jsx: Form data:` - what's the itemType value?
- [ ] Should be exactly `"IT"` or `"NON_IT"` (case-sensitive)
- [ ] Verify dropdown selection was made before submission

### Form Submission Fails (Any Form)

- [ ] Look for `📤 RequestSubmission.jsx: Sending request payload:`
- [ ] Check all required fields are filled
- [ ] Look for `❌ RequestSubmission.jsx: ERROR` logs
- [ ] Check Network tab - what HTTP status code did it return?
  - 400: Bad request (check payload in logs)
  - 401: Unauthorized (check token in localStorage)
  - 500: Server error (check backend logs)

### Form Submits but No Redirect

- [ ] Check for `✅ RequestSubmission.jsx: Request created successfully`
- [ ] Look for `🎯 RequestSubmission.jsx: Navigating to` log
- [ ] Check Network tab - did all API calls succeed?

## Data Loading Issues

### Specification Review Page Shows No Items

- [ ] Check `🔍 SpecificationReview.jsx: Mounted with role` - correct role?
- [ ] Look for `✅ SpecificationReview.jsx: Found X specifications to review`
- [ ] If count is 0, backend has no specifications assigned to this user
- [ ] Check backend: `/requests/assigned/specification` endpoint

### Approval Dashboard Shows No Approvals

- [ ] Check `✅ ApprovalDashboard.jsx: Found X items` log
- [ ] If count is 0, no approvals pending for this user
- [ ] Verify backend data - should have requests with status that require approval

### Supply Branch Shows No Jobs

- [ ] Check `✅ SupplyBranchDashboard.jsx: Found X jobs` log
- [ ] If count is 0, no approved requests without procurement methods
- [ ] Backend endpoint `/requests/approved/without-jobs` has no data

## API/Network Issues

### 404 Errors in Network Tab

- [ ] Look at `📤 Request: GET/POST` URL in api/client.js logs
- [ ] Compare with backend API routes
- [ ] Check if endpoint name is correct (case-sensitive, path format)
- [ ] Verify token is valid (check `/auth/me` endpoint)

### 401 Unauthorized Errors

- [ ] Check localStorage has token: Application → localStorage → token
- [ ] Look for `📤 Request ... | Auth: true` in api/client.js logs
- [ ] If Auth is false, token wasn't found - need to login again
- [ ] Token might be expired - try logging out and back in

### 500 Server Errors

- [ ] Check backend server console for error messages
- [ ] Look at `📤 Request` payload in api/client.js logs - is data correct?
- [ ] Check backend database - has required data been seeded?
- [ ] Restart backend server and try again

### Network Tab Shows Pending Requests

- [ ] Backend might be slow or hung
- [ ] Check backend server is running
- [ ] Check Console for errors
- [ ] Try refreshing the page

## Role-Based Feature Issues

### Navigation Menu Items Missing

- [ ] Check `🔗 Navigation.jsx: Building links for role: XXXX`
- [ ] Check `✅ Navigation.jsx: Built X navigation links`
- [ ] Verify user role in localStorage matches expected role
- [ ] Expected menu items per role:
  - REQUESTING_OFFICER: Dashboard, Submit Request
  - DIRECTOR_ICT/MAINTENANCE_ENGINEER: Dashboard, Spec Review
  - DEAN/REGISTRAR/BURSAR/VICE_CHANCELLOR: Dashboard, Approvals
  - SUPPLY_BRANCH/SUBJECT_CLERK: Dashboard, Procurement

### Wrong Actions Available

- [ ] Check user role: Look for `📊 Dashboard.jsx: Component mounted for role: XXXX`
- [ ] Verify that's the role you expect to test
- [ ] Check if that role should have those actions in business logic

## Log Analysis Tips

### Finding Errors Quickly

1. Press Ctrl+F in Console
2. Search for `❌` to see all errors
3. Look at the error message
4. Look above the error for context logs

### Tracing a Single Operation

1. Find the timestamp of when you performed the action
2. Look for relevant logs around that time
3. Follow the sequence: Request sent → Response received → Data processed
4. Look for ✅ (success) or ❌ (error)

### Comparing Expected vs Actual

1. Log shows what the code is actually doing
2. Compare with what you expected should happen
3. Look at data values - are they what you expected?
4. Check error messages for clues

## Common Fixes

| Problem           | Solution                                                   |
| ----------------- | ---------------------------------------------------------- |
| No data shows     | Check endpoint is correct for role, backend has data       |
| Form won't submit | Check all required fields filled, validate payload in logs |
| Login fails       | Verify credentials, check backend `/auth/login` works      |
| 404 errors        | Check endpoint URL matches backend route exactly           |
| 401 errors        | Login again, token might be expired                        |
| Data wrong        | Check role is correct, endpoint selection is correct       |
| Page won't load   | Check Network tab for failed requests, look for ❌ errors  |
| Infinite loading  | Check API request is completing, not hung                  |

## Reporting Issues

When reporting a bug, include:

1. **What you were trying to do**: (login, submit form, view data, etc.)
2. **What happened**: (error message, wrong data, page didn't load, etc.)
3. **Console logs**: Screenshot or copy relevant ❌ error logs
4. **Network errors**: Screenshot Network tab showing failed request
5. **User role**: What role were you logged in as?
6. **Exact error message**: Copy the full error from logs

## Emergency Steps

If everything seems broken:

1. **Hard refresh the page**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear localStorage**:
   - Open DevTools → Application → Storage → Local Storage
   - Right-click → Clear All
   - Refresh page
3. **Logout and login again**:
   - Click logout button
   - Verify localStorage was cleared
   - Login with fresh credentials
4. **Check backend is running**:
   - Backend should be at http://localhost:3000
   - Try accessing in browser directly
   - Check backend console for errors
5. **Check frontend dev server**:
   - Frontend should be running (usually http://localhost:5173)
   - Look for compilation errors in terminal
   - Try restarting: Ctrl+C then `npm run dev`

---

**Remember**: The logs are your best friend! They show exactly what the code is doing. Use them to understand the flow and identify where things go wrong.
