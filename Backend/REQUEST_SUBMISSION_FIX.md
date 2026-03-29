# Request Submission 500 Error - Fixed

## Problem

When submitting a purchase request from the frontend, you received a **500 Internal Server Error**:

```
❌ API Error: {status: 500, url: '/requests', message: 'Internal server error', data: {…}}
```

## Root Cause

**Field Name Mismatch** between frontend and backend:

### Frontend sends (snake_case):

```javascript
{
  item_name: "...",
  item_description: "...",
  technical_specifications: "...",
  estimated_cost: 50000,
  funding_source: "MPP",
  required_date: "2026-04-15",
  justification: "...",
  department: "ICT_CENTER",
  quantity: 5,
  itemType: "IT"
}
```

### Backend expected (camelCase):

```javascript
{
  itemName: "...",
  itemDescription: "...",
  technicalSpecifications: "...",
  estimatedCost: 50000,
  fundingSource: "MPP",
  requiredDate: "2026-04-15",
  justification: "...",
  department: "ICT_CENTER",
  quantity: 5,
  itemType: "IT"
}
```

When the backend repository tried to access `payload.itemName` but received `payload.item_name`, it inserted `NULL` values into required database fields, causing a database constraint violation and 500 error.

## Solution

Updated `Backend/src/services/requestService.js` with a **payload transformer** that converts snake_case field names to camelCase before passing to the repository:

```javascript
// Transform snake_case to camelCase for consistency with repository
const transformedPayload = {
  requesterId: user.id,
  itemName: payload.item_name || payload.itemName,
  itemDescription: payload.item_description || payload.itemDescription,
  technicalSpecifications:
    payload.technical_specifications || payload.technicalSpecifications,
  itemType: payload.itemType || payload.item_type,
  quantity: payload.quantity,
  estimatedCost: payload.estimated_cost || payload.estimatedCost,
  fundingSource: payload.funding_source || payload.fundingSource,
  justification: payload.justification,
  department: payload.department || user.department || "General",
  requiredDate: payload.required_date || payload.requiredDate,
  attachments: payload.attachments || [],
  status: "SUBMITTED",
};
```

**Key features of the fix:**

- ✅ Accepts both snake_case and camelCase (backwards compatible)
- ✅ Transforms all required fields correctly
- ✅ Maintains all existing business logic
- ✅ No changes needed to frontend
- ✅ Added debug logging to track the transformation

## Testing the Fix

1. **Restart the backend server**:

   ```bash
   cd Backend
   npm start
   ```

2. **Try submitting a request** with all required fields:
   - Item Name: "Dell Laptop"
   - Item Type: "IT Equipment"
   - Description: "High-performance laptop"
   - Specifications: "16GB RAM, 512GB SSD"
   - Quantity: 5
   - Cost: 50000
   - Funding: "MPP"
   - Department: "ICT Center"
   - Required Date: (future date)
   - Justification: "For development team"

3. **Check the logs**:
   - **Frontend Console** (F12): Should show ✅ success logs
   - **Backend Terminal**: Should show detailed debug logs from the transformer

4. **Expected outcome**: Request should be created successfully and you should be redirected to the request details page.

## Debug Logging Added

The backend now logs every step of request submission:

```
📝 Backend: Request submission initiated
📋 Backend: Received payload: { item_name: "...", ... }
✅ Backend: Transformed payload: { itemName: "...", ... }
🔄 Backend: ItemType normalized: IT -> IT
🔍 Backend: Looking for checker with role: DIRECTOR_ICT
✅ Backend: Found 1 specification checker(s)
✅ Backend: Found 9 approver(s)
💾 Backend: Creating purchase request with data: { itemName: "...", ... }
✅ Backend: Request created with ID: 1
✅ Backend: Request number assigned: RQ/2026/1
✅ Backend: Specification checker assigned: 2
✅ Backend: Approval slots created for 9 approvers
✅ Backend: Request submission complete, request ID: RQ/2026/1
```

## Files Modified

- **`Backend/src/services/requestService.js`**
  - Added payload transformation logic
  - Added comprehensive debug logging
  - No other changes to existing logic

## Related Files (No Changes Needed)

- **Frontend**: No changes required
  - Still sends snake_case fields as before
  - Backend now handles the conversion automatically

- **Backend Repository**: No changes needed
  - Still expects camelCase fields
  - Service layer now provides them

- **Database Schema**: No changes
  - Schema requirements unchanged

## Future Improvements

To prevent similar issues in the future:

1. ✅ Standardize on one naming convention (recommend camelCase in backend)
2. ✅ Add input validation middleware
3. ✅ Consider adding a payload schema validation library (e.g., Joi, Zod)
4. ✅ Document API request/response formats clearly
5. ✅ Add unit tests for request submission

## Error Prevention Checklist

Before submitting a request in the future, ensure:

- [ ] All form fields are filled (marked with \*)
- [ ] Item Type is selected (IT Equipment or Non-IT Equipment)
- [ ] Quantity is a number > 0
- [ ] Cost is a valid number
- [ ] Required Date is in the future
- [ ] All text fields have content
- [ ] Funding Source is selected
- [ ] Department is selected
- [ ] Justification explains why the item is needed

If you get a 500 error:

1. Check backend console for error message
2. Verify all required fields in form are filled
3. Check that database is running
4. Check that all test users exist in database
5. See the debug logs in backend to understand what failed

---

**The fix is deployed and ready to test. Try submitting a request now!** ✅
