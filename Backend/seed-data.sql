-- Procurement Documentation & Notification System
-- Data input SQL (seed script) aligned with schema.sql
-- Usage:
--   psql -U postgres -d procurement -f seed-data.sql

BEGIN;

-- =========================================================
-- 1) USERS (all required roles)
-- =========================================================
INSERT INTO users (full_name, email, password_hash, role, department)
VALUES
  ('Requesting Officer', 'requester@univ.edu', '$2b$10$placeholder.hash.requester', 'REQUESTING_OFFICER', 'Computer Science'),
  ('Director ICT', 'director.ict@univ.edu', '$2b$10$placeholder.hash.ict', 'DIRECTOR_ICT', 'ICT Center'),
  ('Maintenance Engineer', 'maintenance@univ.edu', '$2b$10$placeholder.hash.maint', 'MAINTENANCE_ENGINEER', 'Maintenance'),
  ('Dean', 'dean@univ.edu', '$2b$10$placeholder.hash.dean', 'DEAN', 'Administration'),
  ('Registrar', 'registrar@univ.edu', '$2b$10$placeholder.hash.registrar', 'REGISTRAR', 'Administration'),
  ('Bursar', 'bursar@univ.edu', '$2b$10$placeholder.hash.bursar', 'BURSAR', 'Finance'),
  ('Vice Chancellor', 'vc@univ.edu', '$2b$10$placeholder.hash.vc', 'VICE_CHANCELLOR', 'Administration'),
  ('Supply Branch Officer', 'supply@univ.edu', '$2b$10$placeholder.hash.supply', 'SUPPLY_BRANCH', 'Supply Branch'),
  ('Subject Clerk', 'clerk@univ.edu', '$2b$10$placeholder.hash.clerk', 'SUBJECT_CLERK', 'Supply Branch')
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department;

-- =========================================================
-- 2) SUPPLIERS
-- =========================================================
INSERT INTO suppliers (name, email, category)
VALUES
  ('TechNova Solutions', 'quotes@technova.com', 'IT Equipment'),
  ('Digital Matrix', 'sales@digitalmatrix.com', 'IT Equipment'),
  ('Prime Office Mart', 'bids@primeoffice.com', 'Office Equipment'),
  ('LabCore Instruments', 'procurement@labcore.com', 'Laboratory Equipment')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 3) PURCHASE REQUESTS
--    A) Fully progressed request (for approvals + job flow)
--    B) Request waiting for requester confirmation
-- =========================================================
INSERT INTO purchase_requests (
  request_id,
  requester_id,
  item_name,
  item_description,
  technical_specifications,
  item_type,
  quantity,
  estimated_cost,
  funding_source,
  justification,
  department,
  required_date,
  attachments,
  status,
  specification_checker_id,
  checked_specifications,
  updated_at
)
SELECT
  'PR-2026-00001',
  req.id,
  'Laptop',
  'Core i7 laptops for student lab',
  'Intel Core i7, 16GB RAM, 512GB SSD, 14 inch',
  'IT',
  10,
  15000.00,
  'MPP',
  'Required for programming laboratory sessions',
  'Computer Science',
  DATE '2026-04-15',
  '["laptop-spec.pdf"]'::jsonb,
  'PROCUREMENT_STARTED',
  ict.id,
  'Verified minimum specs: i7, 16GB RAM, 512GB SSD',
  NOW()
FROM users req, users ict
WHERE req.email = 'requester@univ.edu'
  AND ict.email = 'director.ict@univ.edu'
ON CONFLICT (request_id) DO UPDATE
SET
  status = EXCLUDED.status,
  checked_specifications = EXCLUDED.checked_specifications,
  specification_checker_id = EXCLUDED.specification_checker_id,
  updated_at = NOW();

INSERT INTO purchase_requests (
  request_id,
  requester_id,
  item_name,
  item_description,
  technical_specifications,
  item_type,
  quantity,
  estimated_cost,
  funding_source,
  justification,
  department,
  required_date,
  attachments,
  status,
  specification_checker_id,
  checked_specifications,
  updated_at
)
SELECT
  'PR-2026-00002',
  req.id,
  'Air Conditioner',
  'Server room cooling unit',
  '2 Ton inverter AC, low-noise, includes installation',
  'NON_IT',
  2,
  3000.00,
  'SPECIAL_FUND',
  'Stable temperature required for equipment safety',
  'ICT Center',
  DATE '2026-05-01',
  '["ac-spec.pdf"]'::jsonb,
  'SPEC_RETURNED_TO_REQUESTER',
  me.id,
  'Reviewed with recommendation for final quantity check',
  NOW()
FROM users req, users me
WHERE req.email = 'requester@univ.edu'
  AND me.email = 'maintenance@univ.edu'
ON CONFLICT (request_id) DO UPDATE
SET
  status = EXCLUDED.status,
  checked_specifications = EXCLUDED.checked_specifications,
  specification_checker_id = EXCLUDED.specification_checker_id,
  updated_at = NOW();

-- =========================================================
-- 4) SPECIFICATION REVIEWS
-- =========================================================
INSERT INTO specification_reviews (
  purchase_request_id,
  checker_id,
  reviewed_specifications,
  review_notes,
  decision
)
SELECT
  pr.id,
  u.id,
  'Verified minimum specs: i7, 16GB RAM, 512GB SSD',
  'Compliant with academic lab usage requirements',
  'RETURNED_TO_REQUESTER'
FROM purchase_requests pr
JOIN users u ON u.email = 'director.ict@univ.edu'
WHERE pr.request_id = 'PR-2026-00001'
  AND NOT EXISTS (
    SELECT 1
    FROM specification_reviews sr
    WHERE sr.purchase_request_id = pr.id
      AND sr.checker_id = u.id
  );

INSERT INTO specification_reviews (
  purchase_request_id,
  checker_id,
  reviewed_specifications,
  review_notes,
  decision
)
SELECT
  pr.id,
  u.id,
  'Reviewed with recommendation for final quantity check',
  'Please confirm quantity and placement location',
  'RETURNED_TO_REQUESTER'
FROM purchase_requests pr
JOIN users u ON u.email = 'maintenance@univ.edu'
WHERE pr.request_id = 'PR-2026-00002'
  AND NOT EXISTS (
    SELECT 1
    FROM specification_reviews sr
    WHERE sr.purchase_request_id = pr.id
      AND sr.checker_id = u.id
  );

-- =========================================================
-- 5) APPROVALS (for PR-2026-00001)
-- =========================================================
INSERT INTO approvals (
  purchase_request_id,
  approver_id,
  approver_role,
  decision,
  comments,
  decided_at
)
SELECT
  pr.id,
  u.id,
  u.role,
  'APPROVED',
  'Approved by authority',
  NOW()
FROM purchase_requests pr
JOIN users u ON u.role IN ('DEAN', 'REGISTRAR', 'BURSAR', 'VICE_CHANCELLOR')
WHERE pr.request_id = 'PR-2026-00001'
ON CONFLICT (purchase_request_id, approver_id) DO UPDATE
SET
  decision = EXCLUDED.decision,
  comments = EXCLUDED.comments,
  decided_at = EXCLUDED.decided_at;

-- =========================================================
-- 6) JOB + CLERK ASSIGNMENT
-- =========================================================
INSERT INTO jobs (
  purchase_request_id,
  procurement_method,
  year,
  serial_number,
  job_number,
  supplier_category,
  assigned_clerk_id,
  status
)
SELECT
  pr.id,
  'NCB',
  2026,
  1,
  'NCB-2026-001',
  'IT Equipment',
  c.id,
  'CLERK_ASSIGNED'
FROM purchase_requests pr
JOIN users c ON c.email = 'clerk@univ.edu'
WHERE pr.request_id = 'PR-2026-00001'
ON CONFLICT (job_number) DO UPDATE
SET
  supplier_category = EXCLUDED.supplier_category,
  assigned_clerk_id = EXCLUDED.assigned_clerk_id,
  status = EXCLUDED.status;

-- =========================================================
-- 7) JOB SUPPLIER MAPPING
-- =========================================================
INSERT INTO job_suppliers (job_id, supplier_id, quotation_received, quoted_price, submission_date, evaluation_result)
SELECT
  j.id,
  s.id,
  FALSE,
  NULL,
  NULL,
  NULL
FROM jobs j
JOIN suppliers s ON s.category = 'IT Equipment'
WHERE j.job_number = 'NCB-2026-001'
ON CONFLICT (job_id, supplier_id) DO NOTHING;

-- =========================================================
-- 8) QUOTATION REQUESTS
-- =========================================================
INSERT INTO quotation_requests (job_id, supplier_id, letter_content, submission_deadline)
SELECT
  j.id,
  s.id,
  'University Procurement Unit\nJob Number: NCB-2026-001\nItem: Laptop\nSubmit quotation before deadline.',
  DATE '2026-04-25'
FROM jobs j
JOIN job_suppliers js ON js.job_id = j.id
JOIN suppliers s ON s.id = js.supplier_id
WHERE j.job_number = 'NCB-2026-001'
ON CONFLICT (job_id, supplier_id) DO UPDATE
SET
  letter_content = EXCLUDED.letter_content,
  submission_deadline = EXCLUDED.submission_deadline,
  sent_at = NOW();

-- =========================================================
-- 9) NOTIFICATIONS
-- =========================================================
INSERT INTO notifications (user_id, event_type, subject, message)
SELECT
  u.id,
  'REQUEST_SUBMITTED',
  'Request Submitted',
  'Purchase request PR-2026-00001 submitted for processing.'
FROM users u
WHERE u.email IN (
  'requester@univ.edu',
  'director.ict@univ.edu',
  'dean@univ.edu',
  'registrar@univ.edu',
  'bursar@univ.edu',
  'vc@univ.edu'
);

INSERT INTO notifications (user_id, event_type, subject, message)
SELECT
  u.id,
  'JOB_NUMBER_GENERATED',
  'Job Number Generated',
  'Job NCB-2026-001 has been generated and assigned.'
FROM users u
WHERE u.email IN (
  'requester@univ.edu',
  'supply@univ.edu',
  'clerk@univ.edu'
);

COMMIT;
