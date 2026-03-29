# Quick Reference Card

## How to View Logs

```
1. Press F12 (or Right-click → Inspect)
2. Click "Console" tab
3. Perform an action (login, submit form, etc.)
4. Look for logs with emoji prefixes
5. Search for ❌ to find errors
```

## Common Workflows

### Test Login

```
1. Open http://localhost:5173
2. Login with: requester@example.com / password123
3. Console shows:
   🔐 Login attempt
   📤 Request sent
   ✅ Login successful
   💾 Token saved
```

### Submit Request Form

```
1. Click "Submit Request"
2. Fill form (itemType = "IT Equipment")
3. Click Submit
4. Console shows:
   📝 Form submitted
   📋 Form data logged
   ✅ ItemType validated
   📤 Payload sent
   ✅ Request created
```

### Check Dashboard Data

```
1. Go to Dashboard
2. Console shows:
   📊 Component mounted for role: XXXX
   🔄 Selected endpoint
   ✅ Loaded X items
3. If no data, look for error:
   ❌ Error details will show why
```

### Test All Roles

```
requester@example.com    → Dashboard (Request list)
director@example.com     → Spec Review
engineer@example.com     → Spec Review
dean@example.com         → Approvals
registrar@example.com    → Approvals
bursar@example.com       → Approvals
vc@example.com           → Approvals
supply@example.com       → Procurement
clerk@example.com        → Procurement

All passwords: password123
```

## Quick Debug Checklist

- [ ] Backend running? (http://localhost:3000)
- [ ] Frontend running? (http://localhost:5173)
- [ ] Console open? (F12 → Console)
- [ ] No ❌ errors? (search console for it)
- [ ] API status 200? (look for 📥 Response: 200)
- [ ] Token saved? (DevTools → Application → localStorage)
- [ ] Correct role? (check 📊 logs show right role)

## If Something's Wrong

**No data shows:**

```
→ Check 📊 Dashboard role: is it correct?
→ Check 🔄 endpoint: is it right for that role?
→ Check 📥 response: is status 200?
→ Check 📦 response data: does it have content?
```

**Login fails:**

```
→ Check 🔐 email/password entered correctly
→ Check 📥 response: what status? (200=good, 400=creds wrong, 500=backend down)
→ Check ❌ error message: what does it say?
```

**API error (404, 500, etc):**

```
→ Look for 📤 Request: XXX /api/path
→ Does path match backend route exactly?
→ Check 📥 Response: status
→ Look for 📋 error message
```

**Page won't load:**

```
→ Hard refresh: Ctrl+Shift+R
→ Check Network tab: red errors?
→ Check backend console: error messages?
→ Clear localStorage: DevTools → Application → localStorage → Delete all
```

## Emoji Quick Guide

| Emoji | Means    | Example           |
| ----- | -------- | ----------------- |
| 🚀    | Starting | App init          |
| 🔐    | Auth     | Login             |
| ✅    | Success  | Request OK        |
| ❌    | Error    | Request failed    |
| 📤    | Send     | Request goes out  |
| 📥    | Receive  | Response comes in |
| 📊    | Data     | Data operation    |
| 🔄    | Loading  | Fetching data     |
| 📝    | Form     | Form action       |
| 💾    | Save     | Store data        |

## Console Search Tips

Press Ctrl+F in Console:

- Search `❌` → Find all errors
- Search `Dashboard` → Find Dashboard logs
- Search `response` → Find all responses
- Search `payload` → Find all payloads
- Search `success` → Find all successes

## Keyboard Shortcuts

| Shortcut          | Does              |
| ----------------- | ----------------- |
| F12               | Open DevTools     |
| Ctrl+F            | Search in Console |
| Ctrl+L            | Clear Console     |
| Ctrl+Shift+R      | Hard refresh page |
| Ctrl+Shift+Delete | Clear cache       |

## Files to Know

| File               | Purpose                |
| ------------------ | ---------------------- |
| README.md          | This frontend overview |
| LOGGING_SUMMARY.md | What logging was added |
| LOGGING_GUIDE.md   | Detailed log reference |
| DEBUG_CHECKLIST.md | How to debug issues    |
| TESTING_GUIDE.md   | How to test system     |

## Test User Passwords

All test users: **password123**

- requester@example.com (REQUESTING_OFFICER)
- director@example.com (DIRECTOR_ICT)
- engineer@example.com (MAINTENANCE_ENGINEER)
- dean@example.com (DEAN)
- supply@example.com (SUPPLY_BRANCH)

## URLs to Know

| URL                       | Purpose           |
| ------------------------- | ----------------- |
| http://localhost:5173     | Frontend          |
| http://localhost:3000     | Backend API       |
| http://localhost:3000/api | API endpoint base |

## Common Issues & Fixes

| Problem     | Check                                            |
| ----------- | ------------------------------------------------ |
| No data     | Backend running? Endpoint correct?               |
| Won't login | Email/password right? Backend running?           |
| 404 errors  | Endpoint spelling correct? Backend route exists? |
| 401 errors  | Token valid? Try logging out/in again            |
| Page frozen | Look for ❌ error, check Network tab             |

## Flow to Test Everything

```
1. Login as requester
   ✓ See Dashboard with requests

2. Go to Request Submission
   ✓ Fill form
   ✓ Submit (check itemType is IT or NON_IT)
   ✓ See confirmation

3. Logout and login as director
   ✓ See Spec Review page
   ✓ Review a specification

4. Logout and login as dean
   ✓ See Approvals page
   ✓ Approve/Reject a request

5. Logout and login as supply
   ✓ See Procurement page
   ✓ Select method and suppliers

6. Logout
   ✓ Back to login page
```

Each step should show SUCCESS logs (✅) with no ERRORS (❌).

## Pro Tips

1. **Keep console open while testing**: See logs in real-time
2. **Clear logs before each test**: 🚫 button in Console
3. **Use Console search (Ctrl+F)**: Filter by ❌, component name, or action
4. **Check Network tab**: See actual HTTP requests
5. **Check Application → Storage**: See localStorage, cookies
6. **Copy full logs**: Select all (Ctrl+A), copy for debugging

## Getting Help

1. Check LOGGING_GUIDE.md for what each log means
2. Check DEBUG_CHECKLIST.md for common issues
3. Check TESTING_GUIDE.md for expected behavior
4. Look at logs for ❌ error messages
5. Check Network tab for HTTP status/response

---

**TL;DR: Open Console (F12), perform action, watch logs appear, look for ❌ errors, use guides to understand logs.**
