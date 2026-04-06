**Extended Workflow After Procurement Schedule**
 
After the **Procurement Schedule** is generated, the system should
continue through **TEC evaluation, committee approval, purchase order
generation, delivery confirmation, payment voucher generation, and
reporting**.
 
**1. Send Procurement Schedule to TEC Board**
 
Once the subject clerk finalizes the procurement schedule, it should be
forwarded to the **TEC Board** for technical evaluation.
 
**Procurement Schedule Example**
 
  -----------------------------------------------------------------------------------
  **Job Number** **Item      **Description**   **Supplier   **Supplier   **Supplier
                 Name**                        1**          2**          3**
  -------------- ----------- ----------------- ------------ ------------ ------------
  NCB-2026-004   Laptop      Core i7 Laptop                              
 
  -----------------------------------------------------------------------------------
 
**System actions**
 
-   mark schedule as **Completed**
 
-   send schedule to **TEC Board**
 
-   update status to **Pending TEC Decision**
 
-   notify:
 
    -   Requesting Officer
 
    -   Approval Official
 
    -   Subject Clerk
 
    -   TEC Members
 
**2. TEC Decision Entry**
 
After TEC reviews the quotations, the **subject clerk** should enter the
TEC decision.
 
**Process**
 
When the clerk enters the **Job Number**, the system should display:
 
-   all item numbers
 
-   item names
 
-   descriptions
 
-   quantities
 
-   all suppliers who were invited or quoted
 
**For each item, the system should provide options to:**
 
-   select the **recommended supplier code**
 
-   display the **recommended supplier name**
 
-   mark other suppliers as:
 
    -   Rejected
 
    -   Recall
 
    -   Call Sample
 
    -   Not Quoted
 
**System actions**
 
-   save TEC recommendations item by item
 
-   save supplier decision status
 
-   allow remarks for each supplier or item
 
-   update status to **TEC Decision Entered**
 
**3. Generate Committee Report**
 
Using TEC decisions, the system should generate a **Committee
Report** automatically.
 
**The report should include**
 
-   Job Number
 
-   Procurement Method
 
-   Supplier name
 
-   Supplier code
 
-   Item name
 
-   Quantity
 
-   Unit price
 
-   Total price per item
 
-   Total amount per supplier
 
-   Total amount for the entire job
 
-   recommended suppliers
 
-   rejected suppliers and status remarks
 
**Example committee report format**
 
  -----------------------------------------------------------------------------
  **Supplier**            **Item**   **Quantity**   **Unit        **Total
                                                    Price**       Cost**
  ----------------------- ---------- -------------- ------------- -------------
  ABC Technologies        Laptop     5              250,000       1,250,000
 
  XYZ Systems             Printer    2              95,000        190,000
  -----------------------------------------------------------------------------
 
**Total Amount of Job:** 1,440,000
 
**System actions**
 
-   calculate totals automatically
 
-   generate downloadable committee report
 
-   store report in document records
 
**4. Route to Minor or Major Committee**
 
The system should decide the committee based on the **total value of the
job**.
 
**Business rule**
 
-   if **total amount is less than 10,000,000** → send to **Minor
    Committee**
 
-   if **total amount is greater than or equal to 10,000,000** → send
    to **Major Committee**
 
**System actions**
 
-   check total job amount
 
-   route automatically to the correct committee
 
-   update status to:
 
    -   **Pending Minor Committee Approval**, or
 
    -   **Pending Major Committee Approval**
 
**Notifications**
 
Send to:
 
-   Requesting Officer
 
-   Approval Official
 
-   Subject Clerk
 
-   relevant committee members
 
**5. Committee Decision**
 
The Minor or Major Committee reviews the committee report.
 
**Possible decisions**
 
-   Approve
 
-   Reject
 
-   Request clarification
 
-   Recommend amendment
 
**System actions**
 
-   if approved, proceed to **Purchase Order Generation**
 
-   if rejected, return to subject clerk / supply branch
 
-   if clarification requested, return for revision
 
**Notifications**
 
Send to:
 
-   Requesting Officer
 
-   Approval Official
 
-   Subject Clerk
 
**6. Purchase Order Generation**
 
After committee approval, the system should generate **Purchase Orders
addressed to the selected suppliers**.
 
**Important rule**
 
Each Purchase Order must be:
 
-   addressed to the **supplier**
 
-   linked to the **job number**
 
-   linked to the **requesting office/unit**
 
-   mention the **delivery location or service location**
 
**Purchase Order should include**
 
-   Purchase Order Number
 
-   Job Number
 
-   Supplier code
 
-   Supplier name
 
-   Supplier address
 
-   Item details
 
-   Quantity
 
-   Unit price
 
-   Total amount
 
-   Delivery location / service location
 
-   Requesting office / department
 
-   delivery deadline
 
-   payment terms
 
**Example**
 
**To:** ABC Technologies (Pvt) Ltd\
**Subject:** Purchase Order for Job No. NCB-2026-004
 
**Delivery Location:**\
Department of Computing and Information Systems\
Faculty of Applied Sciences\
Wayamba University of Sri Lanka
 
**System actions**
 
-   generate separate PO for each selected supplier
 
-   assign PO number
 
-   save PO as PDF
 
-   email PO to supplier
 
-   copy relevant officers
 
**Notifications**
 
Send to:
 
-   Supplier
 
-   Requesting Officer
 
-   Approval Official
 
-   Subject Clerk
 
-   Supply Branch
 
**7. Delivery to Requested Unit**
 
After the supplier delivers the items or completes the service,
the **requesting official** must confirm receipt.
 
**Requirement**
 
The requesting official should receive a **limited-access link** for
delivery confirmation.
 
**Delivery confirmation screen should show**
 
-   Job Number
 
-   PO Number
 
-   Supplier Name
 
-   Item Name
 
-   Quantity delivered
 
-   Delivery date
 
-   remarks
 
-   acceptance confirmation
 
**System actions**
 
-   store delivery confirmation
 
-   update status to **Delivered** or **Accepted**
 
-   prevent full system access through the limited link
 
**8. Generate Delivery Note**
 
Once delivery is confirmed, the system should generate a **Delivery Note
/ Goods Received Note**.
 
**Delivery Note should include**
 
-   Job Number
 
-   Purchase Order Number
 
-   Supplier Name
 
-   Department / requested office
 
-   Item details
 
-   Quantities delivered
 
-   Delivery date
 
-   confirmed by
 
-   remarks
 
**System actions**
 
-   save delivery note in documents
 
-   link it to the purchase order and job
 
**9. Generate Payment Voucher**
 
After delivery confirmation, the system should generate a **Payment
Voucher**.
 
**Payment Voucher should include**
 
-   Voucher Number
 
-   Job Number
 
-   Purchase Order Number
 
-   Supplier Name
 
-   Invoice reference
 
-   Delivery note reference
 
-   payable amount
 
-   department / office
 
-   voucher date
 
**Access**
 
-   subject clerk can **download** payment vouchers
 
-   finance officers can view and process them
 
**System actions**
 
-   generate payment voucher PDF
 
-   store voucher record
 
-   update status to **Payment Voucher Generated**
 
**10. Quarterly and Annual Reports**
 
The system should produce management reports automatically.
 
**Quarterly reports**
 
-   number of requests
 
-   approved jobs
 
-   completed jobs
 
-   pending jobs
 
-   total procurement value
 
-   procurement by method
 
-   procurement by supplier
 
-   procurement by department
 
**Annual reports**
 
-   total annual procurement value
 
-   annual procurement by funding source
 
-   annual procurement by department
 
-   annual procurement by procurement method
 
-   supplier-wise annual totals
 
-   completed delivery summary
 
-   payment voucher summary
 
**Output formats**
 
-   PDF
 
-   Excel
 
**Filter options**
 
-   quarter
 
-   year
 
-   department
 
-   procurement method
 
-   funding source
 
-   supplier
 
-   status
 