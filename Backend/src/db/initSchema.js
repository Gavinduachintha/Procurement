import { query } from "../config/db.js";

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
  `);
};
