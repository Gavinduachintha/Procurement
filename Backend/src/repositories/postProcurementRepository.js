import { pool, query } from "../config/db.js";

const committeeThreshold = 10_000_000;

const nextSerial = async (client, tableName, year) => {
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(serial_number), 0) + 1 AS next_serial
     FROM ${tableName}
     WHERE year = $1`,
    [year],
  );
  return Number(rows[0].next_serial);
};

export const postProcurementRepository = {
  committeeThreshold,

  async findJobContext(jobId) {
    const { rows } = await query(
      `SELECT
         j.*,
         pr.id AS purchase_request_id,
         pr.request_id,
         pr.requester_id,
         pr.item_name,
         pr.item_description,
         pr.quantity,
         pr.department,
         pr.technical_specifications,
         pr.checked_specifications
       FROM jobs j
       JOIN purchase_requests pr ON pr.id = j.purchase_request_id
       WHERE j.id = $1`,
      [jobId],
    );
    return rows[0] || null;
  },

  async updateJobStatus(jobId, status, extras = {}) {
    const values = [jobId, status];
    const sets = ["status = $2"];

    if (Object.prototype.hasOwnProperty.call(extras, "committeeType")) {
      values.push(extras.committeeType || null);
      sets.push(`committee_type = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(extras, "totalAmount")) {
      values.push(extras.totalAmount ?? null);
      sets.push(`total_amount = $${values.length}`);
    }

    const { rows } = await query(
      `UPDATE jobs
       SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING *`,
      values,
    );

    return rows[0] || null;
  },

  async listInvitedSuppliersForJob(jobId) {
    const { rows } = await query(
      `SELECT
         s.id AS supplier_id,
         s.name AS supplier_name,
         s.email,
         js.quotation_received,
         js.quoted_price,
         js.submission_date,
         js.evaluation_result
       FROM job_suppliers js
       JOIN suppliers s ON s.id = js.supplier_id
       WHERE js.job_id = $1
       ORDER BY s.name ASC`,
      [jobId],
    );
    return rows;
  },

  async replaceTecRecommendations({ jobId, createdBy, recommendations }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM tec_recommendations WHERE job_id = $1", [
        jobId,
      ]);

      for (const row of recommendations) {
        await client.query(
          `INSERT INTO tec_recommendations (
             job_id,
             supplier_id,
             item_name,
             item_description,
             quantity,
             unit_price,
             decision_status,
             is_recommended,
             remarks,
             created_by
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            jobId,
            row.supplierId,
            row.itemName,
            row.itemDescription || null,
            row.quantity,
            row.unitPrice,
            row.decisionStatus,
            row.isRecommended,
            row.remarks || null,
            createdBy,
          ],
        );
      }

      await client.query("COMMIT");
      return this.listTecRecommendations(jobId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async listTecRecommendations(jobId) {
    const { rows } = await query(
      `SELECT
         tr.*,
         s.name AS supplier_name,
         s.email AS supplier_email
       FROM tec_recommendations tr
       JOIN suppliers s ON s.id = tr.supplier_id
       WHERE tr.job_id = $1
       ORDER BY tr.id ASC`,
      [jobId],
    );
    return rows;
  },

  async upsertCommitteeReport({
    jobId,
    reportData,
    totalAmount,
    committeeType,
    generatedBy,
  }) {
    const { rows } = await query(
      `INSERT INTO committee_reports (
         job_id, report_data, total_amount, committee_type, generated_by
       ) VALUES ($1, $2::jsonb, $3, $4, $5)
       ON CONFLICT (job_id)
       DO UPDATE SET
         report_data = EXCLUDED.report_data,
         total_amount = EXCLUDED.total_amount,
         committee_type = EXCLUDED.committee_type,
         generated_by = EXCLUDED.generated_by,
         generated_at = NOW()
       RETURNING *`,
      [
        jobId,
        JSON.stringify(reportData),
        totalAmount,
        committeeType,
        generatedBy,
      ],
    );

    return rows[0];
  },

  async getCommitteeReport(jobId) {
    const { rows } = await query(
      "SELECT * FROM committee_reports WHERE job_id = $1",
      [jobId],
    );
    return rows[0] || null;
  },

  async upsertCommitteeDecision({
    jobId,
    committeeType,
    decision,
    remarks,
    decidedBy,
  }) {
    const { rows } = await query(
      `INSERT INTO committee_decisions (
         job_id, committee_type, decision, remarks, decided_by
       ) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (job_id)
       DO UPDATE SET
         committee_type = EXCLUDED.committee_type,
         decision = EXCLUDED.decision,
         remarks = EXCLUDED.remarks,
         decided_by = EXCLUDED.decided_by,
         decided_at = NOW()
       RETURNING *`,
      [jobId, committeeType, decision, remarks || null, decidedBy],
    );

    return rows[0];
  },

  async getCommitteeDecision(jobId) {
    const { rows } = await query(
      "SELECT * FROM committee_decisions WHERE job_id = $1",
      [jobId],
    );
    return rows[0] || null;
  },

  async createPurchaseOrders({
    jobId,
    issuedBy,
    deliveryLocation,
    paymentTerms,
    deliveryDeadline,
  }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const grouped = await client.query(
        `SELECT
           tr.supplier_id,
           MIN(tr.item_name) AS item_name,
           SUM(tr.quantity)::int AS quantity,
           CASE
             WHEN SUM(tr.quantity) = 0 THEN 0
             ELSE ROUND((SUM(tr.unit_price * tr.quantity) / SUM(tr.quantity))::numeric, 2)
           END AS unit_price,
           ROUND(SUM(tr.unit_price * tr.quantity)::numeric, 2) AS total_amount,
           MIN(pr.department) AS department
         FROM tec_recommendations tr
         JOIN jobs j ON j.id = tr.job_id
         JOIN purchase_requests pr ON pr.id = j.purchase_request_id
         WHERE tr.job_id = $1
           AND tr.is_recommended = TRUE
         GROUP BY tr.supplier_id
         ORDER BY tr.supplier_id ASC`,
        [jobId],
      );

      const year = new Date().getFullYear();
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `PO-${year}`,
      ]);

      let serial = await nextSerial(client, "purchase_orders", year);
      const created = [];

      for (const row of grouped.rows) {
        const poNumber = `PO-${year}-${String(serial).padStart(5, "0")}`;

        const inserted = await client.query(
          `INSERT INTO purchase_orders (
             job_id,
             supplier_id,
             po_number,
             year,
             serial_number,
             delivery_location,
             requesting_department,
             item_name,
             quantity,
             unit_price,
             total_amount,
             delivery_deadline,
             payment_terms,
             issued_by
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (job_id, supplier_id)
           DO UPDATE SET
             delivery_location = EXCLUDED.delivery_location,
             requesting_department = EXCLUDED.requesting_department,
             item_name = EXCLUDED.item_name,
             quantity = EXCLUDED.quantity,
             unit_price = EXCLUDED.unit_price,
             total_amount = EXCLUDED.total_amount,
             delivery_deadline = EXCLUDED.delivery_deadline,
             payment_terms = EXCLUDED.payment_terms,
             issued_by = EXCLUDED.issued_by,
             issued_at = NOW()
           RETURNING *`,
          [
            jobId,
            row.supplier_id,
            poNumber,
            year,
            serial,
            deliveryLocation,
            row.department,
            row.item_name,
            row.quantity,
            row.unit_price,
            row.total_amount,
            deliveryDeadline || null,
            paymentTerms || null,
            issuedBy,
          ],
        );

        const po = inserted.rows[0];

        const token = `dlv_${po.id}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
        await client.query(
          `INSERT INTO delivery_confirmations (purchase_order_id, confirmation_token)
           VALUES ($1, $2)
           ON CONFLICT (purchase_order_id)
           DO UPDATE SET confirmation_token = EXCLUDED.confirmation_token`,
          [po.id, token],
        );

        created.push(po);
        serial += 1;
      }

      await client.query("COMMIT");
      return this.listPurchaseOrdersByJob(jobId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async listPurchaseOrdersByJob(jobId) {
    const { rows } = await query(
      `SELECT
         po.*,
         s.name AS supplier_name,
         s.email AS supplier_email,
         dc.confirmation_token,
         dc.acceptance_status,
         dc.delivery_date,
         dc.quantity_delivered,
         dc.confirmed_at,
         dn.note_number AS delivery_note_number,
         pv.voucher_number AS payment_voucher_number
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN delivery_confirmations dc ON dc.purchase_order_id = po.id
       LEFT JOIN delivery_notes dn ON dn.purchase_order_id = po.id
       LEFT JOIN payment_vouchers pv ON pv.purchase_order_id = po.id
       WHERE po.job_id = $1
       ORDER BY po.id ASC`,
      [jobId],
    );
    return rows;
  },

  async findDeliveryByToken(token) {
    const { rows } = await query(
      `SELECT
         dc.*,
         po.id AS purchase_order_id,
         po.po_number,
         po.job_id,
         po.item_name,
         po.quantity,
         po.total_amount,
         po.requesting_department,
         s.id AS supplier_id,
         s.name AS supplier_name,
         j.job_number
       FROM delivery_confirmations dc
       JOIN purchase_orders po ON po.id = dc.purchase_order_id
       JOIN suppliers s ON s.id = po.supplier_id
       JOIN jobs j ON j.id = po.job_id
       WHERE dc.confirmation_token = $1`,
      [token],
    );
    return rows[0] || null;
  },

  async confirmDeliveryByToken(token, payload) {
    const { rows } = await query(
      `UPDATE delivery_confirmations
       SET
         confirmed_by_user_id = $2,
         quantity_delivered = $3,
         delivery_date = $4,
         remarks = $5,
         acceptance_status = $6,
         confirmed_at = NOW()
       WHERE confirmation_token = $1
       RETURNING *`,
      [
        token,
        payload.confirmedByUserId || null,
        payload.quantityDelivered,
        payload.deliveryDate,
        payload.remarks || null,
        payload.acceptanceStatus,
      ],
    );
    return rows[0] || null;
  },

  async getDeliveryConfirmationByPurchaseOrderId(purchaseOrderId) {
    const { rows } = await query(
      `SELECT *
       FROM delivery_confirmations
       WHERE purchase_order_id = $1`,
      [purchaseOrderId],
    );
    return rows[0] || null;
  },

  async createDeliveryNote({ purchaseOrderId, createdBy, noteContent }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM delivery_notes WHERE purchase_order_id = $1",
        [purchaseOrderId],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return existing.rows[0];
      }

      const year = new Date().getFullYear();
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `DN-${year}`,
      ]);
      const serial = await nextSerial(client, "delivery_notes", year);
      const noteNumber = `DN-${year}-${String(serial).padStart(5, "0")}`;

      const inserted = await client.query(
        `INSERT INTO delivery_notes (
           purchase_order_id,
           note_number,
           year,
           serial_number,
           note_content,
           created_by
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         RETURNING *`,
        [
          purchaseOrderId,
          noteNumber,
          year,
          serial,
          JSON.stringify(noteContent),
          createdBy,
        ],
      );

      await client.query("COMMIT");
      return inserted.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getDeliveryNoteByPurchaseOrderId(purchaseOrderId) {
    const { rows } = await query(
      "SELECT * FROM delivery_notes WHERE purchase_order_id = $1",
      [purchaseOrderId],
    );
    return rows[0] || null;
  },

  async createPaymentVoucher({
    purchaseOrderId,
    createdBy,
    invoiceReference,
    deliveryNoteReference,
    payableAmount,
    department,
    voucherDate,
  }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT * FROM payment_vouchers WHERE purchase_order_id = $1",
        [purchaseOrderId],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return existing.rows[0];
      }

      const year = new Date().getFullYear();
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `PV-${year}`,
      ]);
      const serial = await nextSerial(client, "payment_vouchers", year);
      const voucherNumber = `PV-${year}-${String(serial).padStart(5, "0")}`;

      const inserted = await client.query(
        `INSERT INTO payment_vouchers (
           purchase_order_id,
           voucher_number,
           year,
           serial_number,
           invoice_reference,
           delivery_note_reference,
           payable_amount,
           department,
           voucher_date,
           created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          purchaseOrderId,
          voucherNumber,
          year,
          serial,
          invoiceReference || null,
          deliveryNoteReference || null,
          payableAmount,
          department,
          voucherDate,
          createdBy,
        ],
      );

      await client.query("COMMIT");
      return inserted.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getPurchaseOrderById(purchaseOrderId) {
    const { rows } = await query(
      `SELECT po.*, s.name AS supplier_name, s.email AS supplier_email
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       WHERE po.id = $1`,
      [purchaseOrderId],
    );
    return rows[0] || null;
  },

  async quarterlyReport({
    year,
    quarter,
    department,
    procurementMethod,
    status,
  }) {
    const where = ["EXTRACT(YEAR FROM j.created_at) = $1"];
    const values = [year];

    if (quarter) {
      values.push(quarter);
      where.push(`EXTRACT(QUARTER FROM j.created_at) = $${values.length}`);
    }

    if (department) {
      values.push(department);
      where.push(`pr.department = $${values.length}`);
    }

    if (procurementMethod) {
      values.push(procurementMethod);
      where.push(`j.procurement_method = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`j.status = $${values.length}`);
    }

    const clause = where.join(" AND ");

    const [
      { rows: totals },
      { rows: byMethod },
      { rows: bySupplier },
      { rows: byDepartment },
    ] = await Promise.all([
      query(
        `SELECT
             COUNT(*)::int AS total_jobs,
             COUNT(*) FILTER (WHERE j.status = 'COMMITTEE_APPROVED' OR j.status = 'PURCHASE_ORDER_GENERATED' OR j.status = 'DELIVERED' OR j.status = 'ACCEPTED' OR j.status = 'PAYMENT_VOUCHER_GENERATED')::int AS approved_jobs,
             COUNT(*) FILTER (WHERE j.status = 'PAYMENT_VOUCHER_GENERATED')::int AS completed_jobs,
             COUNT(*) FILTER (WHERE j.status <> 'PAYMENT_VOUCHER_GENERATED')::int AS pending_jobs,
             COALESCE(SUM(j.total_amount), 0)::numeric(14,2) AS total_procurement_value
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           WHERE ${clause}`,
        values,
      ),
      query(
        `SELECT j.procurement_method, COUNT(*)::int AS jobs, COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS total_amount
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           WHERE ${clause}
           GROUP BY j.procurement_method
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT s.name AS supplier_name, COALESCE(SUM(po.total_amount), 0)::numeric(14,2) AS total_amount
           FROM purchase_orders po
           JOIN suppliers s ON s.id = po.supplier_id
           JOIN jobs j ON j.id = po.job_id
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           WHERE ${clause}
           GROUP BY s.name
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT pr.department, COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS total_amount, COUNT(*)::int AS jobs
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           WHERE ${clause}
           GROUP BY pr.department
           ORDER BY total_amount DESC`,
        values,
      ),
    ]);

    return {
      summary: totals[0] || {},
      byMethod,
      bySupplier,
      byDepartment,
    };
  },

  async annualReport({
    year,
    department,
    procurementMethod,
    fundingSource,
    supplier,
    status,
  }) {
    const where = ["EXTRACT(YEAR FROM j.created_at) = $1"];
    const values = [year];

    if (department) {
      values.push(department);
      where.push(`pr.department = $${values.length}`);
    }

    if (procurementMethod) {
      values.push(procurementMethod);
      where.push(`j.procurement_method = $${values.length}`);
    }

    if (fundingSource) {
      values.push(fundingSource);
      where.push(`pr.funding_source = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`j.status = $${values.length}`);
    }

    if (supplier) {
      values.push(supplier);
      where.push(`s.name = $${values.length}`);
    }

    const clause = where.join(" AND ");

    const [
      { rows: totals },
      { rows: byFunding },
      { rows: byDepartment },
      { rows: byMethod },
      { rows: bySupplier },
      { rows: paymentVoucherSummary },
    ] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS annual_total_procurement_value,
                  COUNT(*)::int AS total_jobs
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           LEFT JOIN purchase_orders po ON po.job_id = j.id
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE ${clause}`,
        values,
      ),
      query(
        `SELECT pr.funding_source, COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS total_amount
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           LEFT JOIN purchase_orders po ON po.job_id = j.id
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE ${clause}
           GROUP BY pr.funding_source
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT pr.department, COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS total_amount
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           LEFT JOIN purchase_orders po ON po.job_id = j.id
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE ${clause}
           GROUP BY pr.department
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT j.procurement_method, COALESCE(SUM(j.total_amount),0)::numeric(14,2) AS total_amount
           FROM jobs j
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           LEFT JOIN purchase_orders po ON po.job_id = j.id
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE ${clause}
           GROUP BY j.procurement_method
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT s.name AS supplier_name, COALESCE(SUM(po.total_amount),0)::numeric(14,2) AS total_amount
           FROM purchase_orders po
           JOIN suppliers s ON s.id = po.supplier_id
           JOIN jobs j ON j.id = po.job_id
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           WHERE ${clause}
           GROUP BY s.name
           ORDER BY total_amount DESC`,
        values,
      ),
      query(
        `SELECT COUNT(*)::int AS payment_voucher_count,
                  COALESCE(SUM(pv.payable_amount),0)::numeric(14,2) AS payment_voucher_total
           FROM payment_vouchers pv
           JOIN purchase_orders po ON po.id = pv.purchase_order_id
           JOIN jobs j ON j.id = po.job_id
           JOIN purchase_requests pr ON pr.id = j.purchase_request_id
           LEFT JOIN suppliers s ON s.id = po.supplier_id
           WHERE ${clause}`,
        values,
      ),
    ]);

    return {
      summary: totals[0] || {},
      byFunding,
      byDepartment,
      byMethod,
      bySupplier,
      paymentVoucherSummary: paymentVoucherSummary[0] || {},
    };
  },
};
