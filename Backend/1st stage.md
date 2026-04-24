# Workflow for the Procurement Documentation & Notification System

**University Procurement Process – System Workflow**  
*Last updated based on provided rules (specification checking flow revised)*

## Stage 1: Purchase Request Submission

**Responsible Person:** Requesting Officer

**Actions:**
- Submits purchase request through the system

**Information Provided:**
- Item name
- Item description
- Technical specifications
- Quantity
- Estimated cost
- Funding source  
  - MPP  
  - Self-fund  
  - Special fund
- Justification
- Department
- Required date
- Attachments (e.g. technical specifications document)

**System Actions:**
- Generates unique **Request ID**
- Sets status = **Submitted**

**Notifications (Email):**
- Specification Checking Officer
- Requesting Officer
- Approval Officials (Dean / Registrar / Bursar / Vice Chancellor)

## Stage 2: Specification Verification

**Responsible Officers:**
- **IT-related items** → Director – ICT Center
- **Non-IT items** → Maintenance Engineer

**Process:**
1. Checking officer reviews and verifies specifications
2. Ensures specifications match the actual requirement
3. **Important Rule:** Checking officer **cannot** send directly to approval

**Next Steps:**
- Reviewed specifications are returned to the **Requesting Officer**
- Requesting Officer must **confirm / review** the checked specifications

**Requesting Officer Options:**
- Accept the checked specifications → proceed
- Request modification → send back for rework

**Only after Requesting Officer approval** can the request proceed.

**Notifications (Email):**
- Requesting Officer
- Approval Officials

## Stage 3: Administrative Approval

**Responsible Officials:**
- Dean
<!-- - Registrar
- Bursar
- Vice Chancellor -->

**Approval Checks:**
- Item exists in **Master Procurement Plan (MPP)**?
- Amount does **not exceed** MPP allocation?
- Funding source is valid?
- Justification is appropriate?

**Possible Decisions:**
- Approve
- Reject
- Request clarification

**System Action (if approved):**
- Forward request to **Supply Branch**

**Notifications (Email):**
- Requesting Officer
- Approval Officials
- Supply Branch

## Stage 4: Procurement Method Selection

**Responsible Unit:** Supply Branch (SAB)

**Possible Procurement Methods:**
- SQ  – Sealed Quotation
- HQ  – Hand Quotation
- ICB – International Competitive Bidding
- LIB – Limited International Bidding
- LNB – Limited National Bidding
- NCB – National Competitive Bidding
- National Shopping

## Stage 5: Job Number Generation

**Format:**  
`ProcurementMethod-Year-SerialNumber`

**Examples:**

| Procurement Method | Example Job Number |
|---------------------|---------------------|
| SQ                  | SQ-2026-015        |
| HQ                  | HQ-2026-008        |
| ICB                 | ICB-2026-002       |
| NCB                 | NCB-2026-010       |

**System Actions:**
- Automatically generates Job Number
- Creates job record

**Notifications (Email):**
- Requesting Officer
- Approval Officials
- Assigned Supply Branch Clerk

## Stage 6: Job Allocation to Subject Clerks

**Responsible:** Supply Branch

- Job assigned to appropriate **subject clerk** (based on method or item category)

**Clerk Dashboard Shows:**
- Job Number
- Procurement Method
- Item Name
- Department
- Request Status
- Pending jobs list

## Stage 7: Supplier Category Selection

**Responsible:** Subject Clerk

- Selects appropriate **supplier category**  
  Examples:  
  - IT Equipment  
  - Electrical Equipment  
  - Laboratory Equipment  
  - Furniture  
  - Office Equipment

**System Action:**
- Retrieves all **registered suppliers** under selected category

## Stage 8: Supplier Selection

- Officials select suppliers from the filtered list

**System Actions:**
- Stores selected suppliers
- Attaches supplier list to the job

## Stage 9: Quotation Request Letter Generation

**System automatically generates letters containing:**

- University name
- Job number (with procurement method)
- Item description
- Technical specifications
- Deadline for quotation submission
- Contact information

**Output Options:**
- Download as PDF
- Print
- Send via email to selected suppliers

## Stage 10: Procurement Schedule Generation

**System creates Procurement Schedule Table**

**When it starts:**
- Immediately after Stage 9 (Quotation Request Letters are generated/sent)
- System does **not** wait for supplier quotations to create the schedule

**How it is generated:**
- Schedule header is created from job details (Job Number, item, description)
- One schedule line is created for each invited supplier
- Quotation fields are initialized as empty

**During quotation period:**
- Officers update each supplier line when quotations are received
- Updated fields include: quotation received, quoted price, submission date, evaluation result

**After deadline:**
- Schedule is frozen (no more quotation edits)
- Evaluation and recommendation proceed using the same schedule data

**Example structure:**

| Job Number   | Item Name | Description        | Supplier A | Supplier B | Supplier C |
|--------------|-----------|--------------------|------------|------------|------------|
| NCB-2026-004 | Laptop    | Core i7 Laptop     |            |            |            |

- Columns automatically created for each selected supplier
- Used to record: quotation received, price, submission date, evaluation results

## Stage 11: Monitoring and Dashboards

**Available Dashboards:**

**Requesting Officer Dashboard**
- Submitted requests
- Approval status
- Current procurement progress

**Approval Official Dashboard**
- Pending approvals
- Approved requests
- Rejected requests

**Supply Branch Dashboard**
- Active procurement jobs
- Quotation status
- Supplier responses

## Stage 12: Notification System

**Major events trigger automatic email notifications to:**

- Requesting Officer
- Approval Officials

**Key Notification Events:**
- Request submitted
- Specification review completed
- Requesting officer confirmation required
- Request approved
- Job number generated
- Procurement process started
- Quotation requests issued
- Procurement completed

## Simplified Linear Workflow

1. **Requesting Officer** → Submit Purchase Request
2. **Specification Checking** → Director ICT / Maintenance Engineer
3. **Requesting Officer** → Confirm / Accept Checked Specifications
4. **Approval Authority** → Dean / Registrar / Bursar / VC
5. **Supply Branch** → Select Procurement Method
6. **System** → Generate Job Number (includes method code)
7. **Supply Branch** → Assign Job to Subject Clerk
8. **Clerk** → Select Supplier Category
9. **System** → Display Registered Suppliers
10. **Clerk / Officials** → Select Suppliers
11. **System** → Generate Quotation Request Letters
12. **System** → Generate Procurement Schedule Table

---
*End of Procurement Workflow Documentation*