import { query } from "../config/db.js";
import bcrypt from "bcrypt";

const MANUAL_TEST_USERS = [
  {
    fullName: "Rohan Requester",
    email: "rohan.requester@univ.edu",
    password: "Req@12345",
    role: "REQUESTING_OFFICER",
    department: "Computer Science",
  },
  {
    fullName: "Diana ICT",
    email: "diana.ict@univ.edu",
    password: "Ict@12345",
    role: "DIRECTOR_ICT",
    department: "ICT Center",
  },
  {
    fullName: "Malik Maintenance",
    email: "malik.maintenance@univ.edu",
    password: "Maint@12345",
    role: "MAINTENANCE_ENGINEER",
    department: "Maintenance",
  },
  {
    fullName: "Asha Dean",
    email: "asha.dean@univ.edu",
    password: "Dean@12345",
    role: "DEAN",
    department: "Administration",
  },
  {
    fullName: "Ravi Registrar",
    email: "ravi.registrar@univ.edu",
    password: "Reg@12345",
    role: "REGISTRAR",
    department: "Administration",
  },
  {
    fullName: "Bela Bursar",
    email: "bela.bursar@univ.edu",
    password: "Bur@12345",
    role: "BURSAR",
    department: "Finance",
  },
  {
    fullName: "Victor Chancellor",
    email: "victor.vc@univ.edu",
    password: "Vc@12345",
    role: "VICE_CHANCELLOR",
    department: "Administration",
  },
  {
    fullName: "Sahan Supply",
    email: "sahan.supply@univ.edu",
    password: "Supply@12345",
    role: "SUPPLY_BRANCH",
    department: "Supply Branch",
  },
  {
    fullName: "Clara Clerk",
    email: "clara.clerk@univ.edu",
    password: "Clerk@12345",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Thenu TEC",
    email: "thenu.tec@univ.edu",
    password: "Tec@12345",
    role: "TEC_MEMBER",
    department: "Technical Evaluation Committee",
  },
  {
    fullName: "Nimal Minor Committee",
    email: "nimal.minor.committee@univ.edu",
    password: "Minor@12345",
    role: "MINOR_COMMITTEE",
    department: "Procurement Committee",
  },
  {
    fullName: "Maya Major Committee",
    email: "maya.major.committee@univ.edu",
    password: "Major@12345",
    role: "MAJOR_COMMITTEE",
    department: "Procurement Committee",
  },
  {
    fullName: "Fari Finance",
    email: "fari.finance@univ.edu",
    password: "Finance@12345",
    role: "FINANCE_OFFICER",
    department: "Finance",
  },
];

const ensureManualTestUsers = async () => {
  for (const manualUser of MANUAL_TEST_USERS) {
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      manualUser.email.toLowerCase(),
    ]);

    if (existing.rowCount > 0) {
      continue;
    }

    const passwordHash = await bcrypt.hash(manualUser.password, 10);

    await query(
      `INSERT INTO users (full_name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        manualUser.fullName,
        manualUser.email.toLowerCase(),
        passwordHash,
        manualUser.role,
        manualUser.department,
      ],
    );
  }
};

export const initializeSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_requests (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT UNIQUE,
      requester_id BIGINT NOT NULL REFERENCES users(id),
      item_name TEXT NOT NULL,
      item_description TEXT,
      technical_specifications TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('IT', 'NON_IT')),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      estimated_cost NUMERIC(14,2) NOT NULL CHECK (estimated_cost >= 0),
      funding_source TEXT NOT NULL CHECK (funding_source IN ('MPP', 'SELF_FUND', 'SPECIAL_FUND')),
      justification TEXT NOT NULL,
      department TEXT NOT NULL,
      required_date DATE NOT NULL,
      attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL,
      specification_checker_id BIGINT REFERENCES users(id),
      checked_specifications TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_request_items (
      id BIGSERIAL PRIMARY KEY,
      purchase_request_id BIGINT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
      line_no INTEGER NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('IT', 'NON_IT')),
      item_name TEXT NOT NULL,
      item_description TEXT,
      technical_specifications TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      estimated_cost NUMERIC(14,2) NOT NULL CHECK (estimated_cost >= 0),
      funding_source TEXT NOT NULL CHECK (funding_source IN ('MPP', 'SELF_FUND', 'SPECIAL_FUND')),
      department TEXT NOT NULL,
      required_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (purchase_request_id, line_no)
    );

    ALTER TABLE purchase_request_items
    ADD COLUMN IF NOT EXISTS item_type TEXT;

    ALTER TABLE purchase_request_items
    ADD COLUMN IF NOT EXISTS funding_source TEXT;

    ALTER TABLE purchase_request_items
    ADD COLUMN IF NOT EXISTS department TEXT;

    ALTER TABLE purchase_request_items
    ADD COLUMN IF NOT EXISTS required_date DATE;

    UPDATE purchase_request_items pri
    SET
      funding_source = pr.funding_source,
      department = pr.department,
      required_date = pr.required_date
    FROM purchase_requests pr
    WHERE pri.purchase_request_id = pr.id
      AND (
        pri.funding_source IS NULL
        OR pri.department IS NULL
        OR pri.required_date IS NULL
      );

    ALTER TABLE purchase_request_items
    ALTER COLUMN funding_source SET NOT NULL;

    ALTER TABLE purchase_request_items
    ALTER COLUMN department SET NOT NULL;

    ALTER TABLE purchase_request_items
    ALTER COLUMN required_date SET NOT NULL;

    ALTER TABLE purchase_request_items
    DROP CONSTRAINT IF EXISTS purchase_request_items_funding_source_check;

    ALTER TABLE purchase_request_items
    ADD CONSTRAINT purchase_request_items_funding_source_check
    CHECK (funding_source IN ('MPP', 'SELF_FUND', 'SPECIAL_FUND'));

    CREATE TABLE IF NOT EXISTS specification_reviews (
      id BIGSERIAL PRIMARY KEY,
      purchase_request_id BIGINT NOT NULL REFERENCES purchase_requests(id),
      checker_id BIGINT NOT NULL REFERENCES users(id),
      reviewed_specifications TEXT NOT NULL,
      review_notes TEXT,
      decision TEXT NOT NULL CHECK (decision IN ('RETURNED_TO_REQUESTER', 'REWORK_REQUESTED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id BIGSERIAL PRIMARY KEY,
      purchase_request_id BIGINT NOT NULL REFERENCES purchase_requests(id),
      approver_id BIGINT NOT NULL REFERENCES users(id),
      approver_role TEXT NOT NULL,
      decision TEXT NOT NULL CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED')),
      comments TEXT,
      decided_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (purchase_request_id, approver_id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id BIGSERIAL PRIMARY KEY,
      purchase_request_id BIGINT NOT NULL UNIQUE REFERENCES purchase_requests(id),
      procurement_method TEXT NOT NULL,
      year INTEGER NOT NULL,
      serial_number INTEGER NOT NULL,
      job_number TEXT NOT NULL UNIQUE,
      supplier_category TEXT,
      assigned_clerk_id BIGINT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'JOB_CREATED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (procurement_method, year, serial_number)
    );

    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS committee_type TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2);

    CREATE TABLE IF NOT EXISTS suppliers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS job_suppliers (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL REFERENCES jobs(id),
      supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
      quotation_received BOOLEAN NOT NULL DEFAULT FALSE,
      quoted_price NUMERIC(14,2),
      submission_date DATE,
      evaluation_result TEXT,
      UNIQUE (job_id, supplier_id)
    );

    CREATE TABLE IF NOT EXISTS quotation_requests (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL REFERENCES jobs(id),
      supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
      letter_content TEXT NOT NULL,
      submission_deadline DATE NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, supplier_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id),
      event_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tec_recommendations (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
      item_name TEXT NOT NULL,
      item_description TEXT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
      decision_status TEXT NOT NULL CHECK (decision_status IN ('RECOMMENDED', 'REJECTED', 'RECALL', 'CALL_SAMPLE', 'NOT_QUOTED')),
      is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
      remarks TEXT,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS committee_reports (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
      report_data JSONB NOT NULL,
      total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
      committee_type TEXT NOT NULL CHECK (committee_type IN ('MINOR', 'MAJOR')),
      generated_by BIGINT REFERENCES users(id),
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS committee_decisions (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
      committee_type TEXT NOT NULL CHECK (committee_type IN ('MINOR', 'MAJOR')),
      decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED', 'RECOMMEND_AMENDMENT')),
      remarks TEXT,
      decided_by BIGINT REFERENCES users(id),
      decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id BIGSERIAL PRIMARY KEY,
      job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
      po_number TEXT NOT NULL UNIQUE,
      year INTEGER NOT NULL,
      serial_number INTEGER NOT NULL,
      delivery_location TEXT NOT NULL,
      requesting_department TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
      total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
      delivery_deadline DATE,
      payment_terms TEXT,
      status TEXT NOT NULL DEFAULT 'PO_GENERATED',
      issued_by BIGINT REFERENCES users(id),
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, supplier_id),
      UNIQUE (year, serial_number)
    );

    CREATE TABLE IF NOT EXISTS delivery_confirmations (
      id BIGSERIAL PRIMARY KEY,
      purchase_order_id BIGINT NOT NULL UNIQUE REFERENCES purchase_orders(id) ON DELETE CASCADE,
      confirmation_token TEXT NOT NULL UNIQUE,
      confirmed_by_user_id BIGINT REFERENCES users(id),
      quantity_delivered INTEGER,
      delivery_date DATE,
      remarks TEXT,
      acceptance_status TEXT CHECK (acceptance_status IN ('DELIVERED', 'ACCEPTED')),
      confirmed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_notes (
      id BIGSERIAL PRIMARY KEY,
      purchase_order_id BIGINT NOT NULL UNIQUE REFERENCES purchase_orders(id) ON DELETE CASCADE,
      note_number TEXT NOT NULL UNIQUE,
      year INTEGER NOT NULL,
      serial_number INTEGER NOT NULL,
      note_content JSONB NOT NULL,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (year, serial_number)
    );

    CREATE TABLE IF NOT EXISTS payment_vouchers (
      id BIGSERIAL PRIMARY KEY,
      purchase_order_id BIGINT NOT NULL UNIQUE REFERENCES purchase_orders(id) ON DELETE CASCADE,
      voucher_number TEXT NOT NULL UNIQUE,
      year INTEGER NOT NULL,
      serial_number INTEGER NOT NULL,
      invoice_reference TEXT,
      delivery_note_reference TEXT,
      payable_amount NUMERIC(14,2) NOT NULL CHECK (payable_amount >= 0),
      department TEXT NOT NULL,
      voucher_date DATE NOT NULL,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (year, serial_number)
    );
  `);

  await ensureManualTestUsers();
};
