# Procurement Frontend

React + Vite frontend for the University Procurement System.

## Features

- **User Authentication**: JWT-based login system
- **Role-Based Access**: Different dashboards for different user roles
- **Request Management**: Submit and track procurement requests
- **Specification Review**: Officers can review technical specifications
- **Approval Workflow**: Multi-level approval process
- **Procurement Management**: Supply branch handles procurement methods and supplier selection
- **Responsive Design**: Works on desktop and mobile devices
- **Comprehensive Logging**: Full visibility into all operations for debugging

## Quick Start

1. **Install dependencies**:

```bash
npm install
```

2. **Create .env.local**:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. **Start frontend**:

```bash
npm run dev
```

4. **Start backend** (in another terminal):

```bash
cd Backend
npm start
```

5. **Open in browser**:

```
http://localhost:5173
```

6. **Open DevTools console** (F12 → Console tab) to see comprehensive logs

## Comprehensive Logging

The frontend now includes detailed logging throughout all pages and components to help with debugging and understanding the system flow.

### View Logs

1. Open Browser DevTools: **F12** or Right-click → "Inspect"
2. Go to **Console** tab
3. Clear logs: Click the 🚫 button
4. Perform an action (login, submit form, navigate, etc.)
5. Watch logs appear with emoji prefixes

### Example Logs

```
🔐 Login.jsx: Login attempt with email: user@example.com
📤 Request: POST /auth/login
📥 Response: 200
✅ Login.jsx: Login successful! User ID: 1, Role: REQUESTING_OFFICER
💾 Login.jsx: Token and user data stored in localStorage
📊 Dashboard.jsx: Component mounted for role: REQUESTING_OFFICER
🔄 Dashboard.jsx: Selected endpoint: /requests/mine
✅ Dashboard.jsx: Loaded 5 items for REQUESTING_OFFICER
```

### What's Logged

✅ **API Calls**: All requests, responses, and errors
✅ **Authentication**: Login, logout, session management
✅ **Data Loading**: Dashboard data, specifications, approvals
✅ **Form Submissions**: Validation, payloads, confirmations
✅ **User Actions**: Navigation, selections, decisions
✅ **Errors**: With full context and error details

### Documentation

For detailed logging information, see:

- **[LOGGING_SUMMARY.md](./LOGGING_SUMMARY.md)** - Overview of all logging
- **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)** - Detailed log reference
- **[DEBUG_CHECKLIST.md](./DEBUG_CHECKLIST.md)** - Debugging tips
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── api/                    # API client with logging
├── components/             # Reusable UI components
├── pages/                  # Page components (all with logging)
├── App.jsx                # Main app component
└── App.css                # Global styles
```

## User Roles

- **REQUESTING_OFFICER**: Submit purchase requests
- **DIRECTOR_ICT**: Review IT specification requests
- **MAINTENANCE_ENGINEER**: Review non-IT specification requests
- **DEAN/REGISTRAR/BURSAR/VICE_CHANCELLOR**: Approve requests
- **SUPPLY_BRANCH**: Manage procurement process
- **SUBJECT_CLERK**: Assist with procurement tasks

## Test Credentials

All test users have password: `password123`

| Role                 | Email                 |
| -------------------- | --------------------- |
| REQUESTING_OFFICER   | requester@example.com |
| DIRECTOR_ICT         | director@example.com  |
| MAINTENANCE_ENGINEER | engineer@example.com  |
| DEAN                 | dean@example.com      |
| REGISTRAR            | registrar@example.com |
| BURSAR               | bursar@example.com    |
| VICE_CHANCELLOR      | vc@example.com        |
| SUPPLY_BRANCH        | supply@example.com    |
| SUBJECT_CLERK        | clerk@example.com     |

See [docs/manual-test-users.txt](../docs/manual-test-users.txt) for all credentials.

## Files with Logging

| File                                  | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `src/api/client.js`                   | API requests/responses with full logging      |
| `src/pages/Login.jsx`                 | Authentication with flow logging              |
| `src/pages/Dashboard.jsx`             | Role-based data loading with endpoint logging |
| `src/pages/RequestSubmission.jsx`     | Form submission with validation logging       |
| `src/pages/RequestDetails.jsx`        | Request detail view with action logging       |
| `src/pages/SpecificationReview.jsx`   | Specification review with submission logging  |
| `src/pages/ApprovalDashboard.jsx`     | Approval workflow with decision logging       |
| `src/pages/SupplyBranchDashboard.jsx` | Procurement with method/supplier logging      |

## Emoji Guide

| Emoji | Meaning           |
| ----- | ----------------- |
| ✅    | Success           |
| ❌    | Error             |
| 📤    | Outgoing request  |
| 📥    | Incoming response |
| 🔐    | Authentication    |
| 📝    | Form data         |
| 💾    | Storage           |
| 📊    | Data              |
| 🔄    | Loading           |
| 🎯    | Navigation        |

## Quick Debugging

### "Nothing happens when I click submit"

→ Open Console (F12) and look for ❌ error logs

### "Dashboard shows no data"

→ Check Console: what endpoint was selected? Does response have status 200?

### "API returns 404"

→ Check Console: what URL is being called? Does it match backend route?

### "Login fails"

→ Check Console: what's the error status? Wrong credentials or backend down?

## Troubleshooting

1. **Clear browser cache**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check backend**: Verify backend is running on http://localhost:3000
4. **Check console logs**: Open DevTools and look for ❌ errors
5. **Review guides**: See LOGGING_GUIDE.md or DEBUG_CHECKLIST.md
