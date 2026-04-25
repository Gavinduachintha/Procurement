import { query } from "../config/db.js";
import bcrypt from "bcrypt";

const MANUAL_TEST_USERS = [
  {
    fullName: "System Admin",
    email: "admin@univ.edu",
    password: "Admin@12345",
    role: "ADMIN",
    department: "Administration",
  },
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
    fullName: "Asha Dean FAS",
    email: "asha.dean.fas@univ.edu",
    password: "DeanFas@123",
    role: "DEAN",
    department: "FAS",
  },
  {
    fullName: "Nalin Dean FOT",
    email: "nalin.dean.fot@univ.edu",
    password: "DeanFot@123",
    role: "DEAN",
    department: "FOT",
  },
  {
    fullName: "Priya Dean FBSF",
    email: "priya.dean.fbsf@univ.edu",
    password: "DeanFbsf@123",
    role: "DEAN",
    department: "FBSF",
  },
  {
    fullName: "Suresh Dean FOM",
    email: "suresh.dean.fom@univ.edu",
    password: "DeanFom@123",
    role: "DEAN",
    department: "FOM",
  },
  {
    fullName: "Kasuni Dean FAPM",
    email: "kasuni.dean.fapm@univ.edu",
    password: "DeanFapm@123",
    role: "DEAN",
    department: "FAPM",
  },
  {
    fullName: "Heshan Dean FLFN",
    email: "heshan.dean.flfn@univ.edu",
    password: "DeanFlfn@123",
    role: "DEAN",
    department: "FLFN",
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
    fullName: "Saman SQ Clerk",
    email: "saman.sq.clerk@univ.edu",
    password: "SqClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Hasini HQ Clerk",
    email: "hasini.hq.clerk@univ.edu",
    password: "HqClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Ravin ICB Clerk",
    email: "ravin.icb.clerk@univ.edu",
    password: "IcbClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Dinuli LIB Clerk",
    email: "dinuli.lib.clerk@univ.edu",
    password: "LibClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Kavish LNB Clerk",
    email: "kavish.lnb.clerk@univ.edu",
    password: "LnbClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Nethmi NCB Clerk",
    email: "nethmi.ncb.clerk@univ.edu",
    password: "NcbClerk@123",
    role: "SUBJECT_CLERK",
    department: "Supply Branch",
  },
  {
    fullName: "Tharindu Shopping Clerk",
    email: "tharindu.shopping.clerk@univ.edu",
    password: "ShopClerk@123",
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

const SAMPLE_SUPPLIERS = [
  {
    name: "TechNova Solutions",
    email: "quotes@technova.com",
    category: "IT Equipment",
  },
  {
    name: "ByteWave Lanka",
    email: "sales@bytewave.lk",
    category: "IT Equipment",
  },
  {
    name: "Digital Horizon",
    email: "bids@digitalhorizon.com",
    category: "IT Equipment",
  },
  {
    name: "PowerGrid Electricals",
    email: "tenders@powergrid.lk",
    category: "Electrical Equipment",
  },
  {
    name: "VoltLine Engineering",
    email: "quotes@voltline.com",
    category: "Electrical Equipment",
  },
  {
    name: "Electra Supplies",
    email: "procurement@electra.lk",
    category: "Electrical Equipment",
  },
  {
    name: "LabCore Instruments",
    email: "procurement@labcore.com",
    category: "Laboratory Equipment",
  },
  {
    name: "BioLab Systems",
    email: "quotes@biolab.lk",
    category: "Laboratory Equipment",
  },
  {
    name: "Precision Labs Asia",
    email: "bids@precisionlabs.asia",
    category: "Laboratory Equipment",
  },
  {
    name: "Prime Office Mart",
    email: "bids@primeoffice.com",
    category: "Furniture",
  },
  {
    name: "Urban Furniture Co",
    email: "sales@urbanfurniture.lk",
    category: "Furniture",
  },
  {
    name: "Campus Furnishings",
    email: "quotes@campusfurnish.com",
    category: "Furniture",
  },
  {
    name: "OfficeLine Traders",
    email: "tenders@officeline.lk",
    category: "Office Equipment",
  },
  {
    name: "StationPro Lanka",
    email: "sales@stationpro.lk",
    category: "Office Equipment",
  },
  {
    name: "WorkHub Supplies",
    email: "quotes@workhub.com",
    category: "Office Equipment",
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

const ensureSampleSuppliers = async () => {
  for (const supplier of SAMPLE_SUPPLIERS) {
    const existing = await query("SELECT id FROM suppliers WHERE email = $1", [
      supplier.email.toLowerCase(),
    ]);

    if (existing.rowCount > 0) {
      continue;
    }

    await query(
      `INSERT INTO suppliers (name, email, category)
       VALUES ($1, $2, $3)`,
      [supplier.name, supplier.email.toLowerCase(), supplier.category],
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

    CREATE TABLE IF NOT EXISTS approval_item_decisions (
      id BIGSERIAL PRIMARY KEY,
      purchase_request_id BIGINT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
      line_no INTEGER NOT NULL,
      approver_id BIGINT NOT NULL REFERENCES users(id),
      decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'REQUEST_MODIFICATION')),
      message TEXT NOT NULL,
      decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (purchase_request_id, line_no, approver_id)
    );

    ALTER TABLE approval_item_decisions
    DROP CONSTRAINT IF EXISTS approval_item_decisions_decision_check;

    ALTER TABLE approval_item_decisions
    ADD CONSTRAINT approval_item_decisions_decision_check
    CHECK (decision IN ('APPROVED', 'REJECTED', 'REQUEST_MODIFICATION'));

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
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS schedule_status TEXT NOT NULL DEFAULT 'NOT_CREATED';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS schedule_created_at TIMESTAMPTZ;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS schedule_deadline DATE;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS schedule_frozen_at TIMESTAMPTZ;

    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_schedule_status_check;
    ALTER TABLE jobs ADD CONSTRAINT jobs_schedule_status_check
    CHECK (schedule_status IN ('NOT_CREATED', 'OPEN', 'FROZEN'));

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

    CREATE TABLE IF NOT EXISTS master_procurement_plans (
      id BIGSERIAL PRIMARY KEY,
      item_code TEXT NOT NULL UNIQUE,
      serial_no INTEGER NOT NULL,
      plan_year INTEGER NOT NULL,
      department TEXT,
      sub_category TEXT,
      description TEXT,
      procurement_category TEXT CHECK (procurement_category IN ('Works', 'Goods', 'Services', 'Consultancy')),
      estimated_cost_mn NUMERIC(14,3) CHECK (estimated_cost_mn > 0),
      source_of_financing TEXT CHECK (source_of_financing IN ('GOSL', 'ADB', 'World Bank', 'Own Revenue', 'Other Donor')),
      donor_financier_name TEXT,
      procurement_method TEXT CHECK (procurement_method IN (
        'ICB',
        'LIB',
        'LNB',
        'NCB',
        'NCB & National Shopping',
        'National Shopping',
        'Direct Contracting'
      )),
      level_of_authority TEXT CHECK (level_of_authority IN ('HLPC', 'SHLPC', 'MPC', 'DPC Minor', 'DPC Major', 'RPC')),
      priority_status TEXT CHECK (priority_status IN ('P', 'N', 'U')),
      current_status TEXT CHECK (current_status IN (
        'Planning for the year 2026',
        'Approval for Procurement Plan 2026',
        'Tender Documents Prepared',
        'Advertised',
        'Bids Evaluated',
        'Contract Awarded',
        'Implementation Ongoing',
        'Completed'
      )),
      commencement_yr1 BOOLEAN NOT NULL DEFAULT TRUE,
      commencement_yr2 BOOLEAN NOT NULL DEFAULT FALSE,
      commencement_yr3 BOOLEAN NOT NULL DEFAULT FALSE,
      completion_yr1 BOOLEAN NOT NULL DEFAULT TRUE,
      completion_yr2 BOOLEAN NOT NULL DEFAULT FALSE,
      completion_yr3 BOOLEAN NOT NULL DEFAULT FALSE,
      contract_period TEXT,
      reference_mtbf_corporate_plan TEXT,
      remark TEXT,
      record_status TEXT NOT NULL CHECK (record_status IN ('DRAFT', 'SUBMITTED')),
      created_by BIGINT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (plan_year, serial_no)
    );
  `);

  await ensureManualTestUsers();
  await ensureSampleSuppliers();
};
