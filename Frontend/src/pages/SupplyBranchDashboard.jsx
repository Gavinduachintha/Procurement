import { useState, useEffect } from "react";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
import Input from "../components/Input";
import TextArea from "../components/TextArea";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import "./SupplyBranchDashboard.css";

const PROCUREMENT_METHODS = [
  { label: "SQ - Sealed Quotation", value: "SQ" },
  { label: "HQ - Hand Quotation", value: "HQ" },
  { label: "ICB - International Competitive Bidding", value: "ICB" },
  { label: "LIB - Limited International Bidding", value: "LIB" },
  { label: "LNB - Limited National Bidding", value: "LNB" },
  { label: "NCB - National Competitive Bidding", value: "NCB" },
  { label: "National Shopping", value: "NATIONAL_SHOPPING" },
];

const SUPPLIER_CATEGORIES = [
  { label: "IT Equipment", value: "IT Equipment" },
  { label: "Electrical Equipment", value: "Electrical Equipment" },
  { label: "Laboratory Equipment", value: "Laboratory Equipment" },
  { label: "Furniture", value: "Furniture" },
  { label: "Office Equipment", value: "Office Equipment" },
];

const TEC_DECISIONS = [
  "RECOMMENDED",
  "REJECTED",
  "RECALL",
  "CALL_SAMPLE",
  "NOT_QUOTED",
];

const COMMITTEE_DECISIONS = [
  "APPROVED",
  "REJECTED",
  "CLARIFICATION_REQUESTED",
  "RECOMMEND_AMENDMENT",
];

const parseData = (response) => response.data?.data || response.data;

export default function SupplyBranchDashboard({ user }) {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("start");

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [subjectClerks, setSubjectClerks] = useState([]);
  const [selectedClerkId, setSelectedClerkId] = useState("");

  const [tecRows, setTecRows] = useState([]);
  const [committeeReport, setCommitteeReport] = useState(null);
  const [committeeDecision, setCommitteeDecision] = useState("");
  const [committeeRemarks, setCommitteeRemarks] = useState("");

  const [poDeliveryLocation, setPoDeliveryLocation] = useState("");
  const [poPaymentTerms, setPoPaymentTerms] = useState("Within 30 days");
  const [poDeliveryDeadline, setPoDeliveryDeadline] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [reportQuarter, setReportQuarter] = useState("1");
  const [reportYear, setReportYear] = useState(
    String(new Date().getFullYear()),
  );
  const [quarterlyReport, setQuarterlyReport] = useState(null);
  const [annualReport, setAnnualReport] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const canManageWorkflow = ["SUPPLY_BRANCH", "SUBJECT_CLERK"].includes(
    user?.role,
  );
  const canStartJobs = user?.role === "SUPPLY_BRANCH";
  const canCommitteeDecide = ["MINOR_COMMITTEE", "MAJOR_COMMITTEE"].includes(
    user?.role,
  );
  const canViewReports = [
    "SUPPLY_BRANCH",
    "MINOR_COMMITTEE",
    "MAJOR_COMMITTEE",
    "FINANCE_OFFICER",
  ].includes(user?.role);

  useEffect(() => {
    console.log(
      "🏭 SupplyBranchDashboard component mounted. User role:",
      user?.role,
    );
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const tasks = [api.get("/dashboard/supply-branch")];
      if (canStartJobs) {
        tasks.push(api.get("/requests/approved/without-jobs"));
      }

      const [jobsRes, approvedRes] = await Promise.all(tasks);

      const jobsData = parseData(jobsRes);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      console.log(
        "✅ Loaded jobs:",
        Array.isArray(jobsData) ? jobsData.length : 0,
      );

      if (canStartJobs && approvedRes) {
        const approvedData = parseData(approvedRes);
        setApprovedRequests(Array.isArray(approvedData) ? approvedData : []);
        console.log(
          "✅ Loaded approved requests without job:",
          Array.isArray(approvedData) ? approvedData.length : 0,
        );
      }
    } catch (err) {
      console.error("❌ Failed to load procurement data", err);
      setError(
        err.response?.data?.message || "Failed to load procurement data",
      );
    } finally {
      setLoading(false);
    }
  };

  const openStartJobModal = (request) => {
    setSelectedRequestId(request.id);
    setSelectedMethod("");
    setModalType("start");
    setIsModalOpen(true);
  };

  const startJob = async () => {
    if (!selectedRequestId || !selectedMethod) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/procurement/${selectedRequestId}/method`, {
        method: selectedMethod,
      });

      setSuccess("Job started successfully and method assigned.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start job");
    } finally {
      setActionLoading(false);
    }
  };

  const openSuppliersModal = (job) => {
    setSelectedJob(job);
    setModalType("suppliers");
    setSelectedCategory(job.supplier_category || "");
    setSupplierOptions([]);
    setSelectedSuppliers([]);
    setIsModalOpen(true);
  };

  const openAssignClerkModal = async (job) => {
    setSelectedJob(job);
    setModalType("assign-clerk");
    setSubjectClerks([]);
    setSelectedClerkId(job.assigned_clerk_id ? String(job.assigned_clerk_id) : "");
    setIsModalOpen(true);
    setActionLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/users", {
        params: { role: "SUBJECT_CLERK" },
      });
      const data = parseData(response);
      setSubjectClerks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clerks");
    } finally {
      setActionLoading(false);
    }
  };

  const submitAssignClerk = async () => {
    if (!selectedJob || !selectedClerkId) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/procurement/jobs/${selectedJob.id}/assign-clerk`, {
        clerkId: Number(selectedClerkId),
      });

      setSuccess("Subject clerk assigned successfully.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign clerk");
    } finally {
      setActionLoading(false);
    }
  };

  const loadSuppliersByCategory = async () => {
    if (!selectedJob || !selectedCategory) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await api.post(
        `/procurement/jobs/${selectedJob.id}/select-category`,
        {
          category: selectedCategory,
        },
      );

      const data = parseData(response);
      setSupplierOptions(Array.isArray(data) ? data : []);
      setSuccess("Category selected. Now choose suppliers.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load suppliers");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSupplier = (supplierId) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId],
    );
  };

  const submitSuppliers = async () => {
    if (!selectedJob || !selectedSuppliers.length) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/procurement/${selectedJob.id}/suppliers`, {
        supplierIds: selectedSuppliers,
      });

      setSuccess("Suppliers selected successfully.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to select suppliers");
    } finally {
      setActionLoading(false);
    }
  };

  const sendToTec = async (job) => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/post-procurement/jobs/${job.id}/send-to-tec`);
      setSuccess(`Job ${job.job_number} sent to TEC.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send schedule to TEC");
    } finally {
      setActionLoading(false);
    }
  };

  const openTecModal = async (job) => {
    setSelectedJob(job);
    setModalType("tec");
    setTecRows([]);
    setIsModalOpen(true);
    setActionLoading(true);
    setError("");

    try {
      const response = await api.get(`/procurement/jobs/${job.id}/schedule`);
      const data = parseData(response);
      const rows = Array.isArray(data?.rows) ? data.rows : [];

      setTecRows(
        rows.map((row) => ({
          supplierId: row.supplierId,
          supplierName: row.supplierName,
          itemName: data?.itemName,
          itemDescription: data?.description,
          quantity: 1,
          unitPrice: Number(row.quotedPrice || 0),
          decisionStatus: "RECOMMENDED",
          isRecommended: true,
          remarks: "",
        })),
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load supplier schedule",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateTecRow = (index, field, value) => {
    setTecRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      if (field === "decisionStatus") {
        row.isRecommended = value === "RECOMMENDED";
      }

      next[index] = row;
      return next;
    });
  };

  const submitTecDecisions = async () => {
    if (!selectedJob || !tecRows.length) return;

    setActionLoading(true);
    setError("");

    try {
      await api.post(`/post-procurement/jobs/${selectedJob.id}/tec-decisions`, {
        decisions: tecRows,
      });

      setSuccess("TEC decisions saved and committee report generated.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save TEC decisions");
    } finally {
      setActionLoading(false);
    }
  };

  const openCommitteeReport = async (job) => {
    setSelectedJob(job);
    setModalType("report");
    setCommitteeReport(null);
    setIsModalOpen(true);
    setActionLoading(true);

    try {
      const response = await api.get(
        `/post-procurement/jobs/${job.id}/committee-report`,
      );
      setCommitteeReport(parseData(response));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load committee report",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const routeToCommittee = async (job) => {
    setActionLoading(true);
    setError("");

    try {
      await api.post(`/post-procurement/jobs/${job.id}/route-committee`);
      setSuccess(`Job ${job.job_number} routed to committee.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to route committee");
    } finally {
      setActionLoading(false);
    }
  };

  const openCommitteeDecisionModal = (job) => {
    setSelectedJob(job);
    setCommitteeDecision("");
    setCommitteeRemarks("");
    setModalType("committee-decision");
    setIsModalOpen(true);
  };

  const submitCommitteeDecision = async () => {
    if (!selectedJob || !committeeDecision) return;

    setActionLoading(true);
    setError("");

    try {
      await api.post(
        `/post-procurement/jobs/${selectedJob.id}/committee-decision`,
        {
          decision: committeeDecision,
          remarks: committeeRemarks,
        },
      );

      setSuccess("Committee decision recorded.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save committee decision",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openPurchaseOrderModal = (job) => {
    setSelectedJob(job);
    setPoDeliveryLocation("");
    setPoPaymentTerms("Within 30 days");
    setPoDeliveryDeadline("");
    setModalType("generate-po");
    setIsModalOpen(true);
  };

  const generatePurchaseOrders = async () => {
    if (!selectedJob || !poDeliveryLocation) return;

    setActionLoading(true);
    setError("");

    try {
      await api.post(
        `/post-procurement/jobs/${selectedJob.id}/purchase-orders`,
        {
          deliveryLocation: poDeliveryLocation,
          paymentTerms: poPaymentTerms,
          deliveryDeadline: poDeliveryDeadline || undefined,
        },
      );

      setSuccess("Purchase orders generated successfully.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate purchase orders",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openPurchaseOrdersList = async (job) => {
    setSelectedJob(job);
    setPurchaseOrders([]);
    setModalType("purchase-orders");
    setIsModalOpen(true);
    setActionLoading(true);

    try {
      const response = await api.get(
        `/post-procurement/jobs/${job.id}/purchase-orders`,
      );
      const data = parseData(response);
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load purchase orders");
    } finally {
      setActionLoading(false);
    }
  };

  const generateDeliveryNote = async (purchaseOrderId) => {
    setActionLoading(true);
    setError("");

    try {
      await api.post(
        `/post-procurement/purchase-orders/${purchaseOrderId}/delivery-note`,
        {
          remarks: "Generated from frontend workflow",
        },
      );
      setSuccess("Delivery note generated.");
      if (selectedJob) {
        await openPurchaseOrdersList(selectedJob);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate delivery note",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const generatePaymentVoucher = async (purchaseOrderId) => {
    setActionLoading(true);
    setError("");

    try {
      await api.post(
        `/post-procurement/purchase-orders/${purchaseOrderId}/payment-voucher`,
        {
          invoiceReference: `INV-${Date.now()}`,
        },
      );
      setSuccess("Payment voucher generated.");
      if (selectedJob) {
        await openPurchaseOrdersList(selectedJob);
      }
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate payment voucher",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const loadQuarterlyReport = async () => {
    setActionLoading(true);
    setError("");

    try {
      const response = await api.get("/post-procurement/reports/quarterly", {
        params: {
          year: Number(reportYear),
          quarter: Number(reportQuarter),
        },
      });
      setQuarterlyReport(parseData(response));
      setSuccess("Quarterly report loaded.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load quarterly report",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const loadAnnualReport = async () => {
    setActionLoading(true);
    setError("");

    try {
      const response = await api.get("/post-procurement/reports/annual", {
        params: { year: Number(reportYear) },
      });
      setAnnualReport(parseData(response));
      setSuccess("Annual report loaded.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load annual report");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      JOB_CREATED: "badge-info",
      CLERK_ASSIGNED: "badge-info",
      CATEGORY_SELECTED: "badge-warning",
      PENDING_TEC_DECISION: "badge-warning",
      TEC_DECISION_ENTERED: "badge-info",
      PENDING_MINOR_COMMITTEE_APPROVAL: "badge-warning",
      PENDING_MAJOR_COMMITTEE_APPROVAL: "badge-warning",
      COMMITTEE_APPROVED: "badge-success",
      COMMITTEE_REJECTED: "badge-danger",
      COMMITTEE_CLARIFICATION_REQUESTED: "badge-warning",
      COMMITTEE_AMENDMENT_REQUESTED: "badge-warning",
      PURCHASE_ORDER_GENERATED: "badge-info",
      DELIVERED: "badge-info",
      ACCEPTED: "badge-success",
      PAYMENT_VOUCHER_GENERATED: "badge-success",
    };

    return map[status] || "badge-info";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  if (loading)
    return <div className="loading-state">Loading procurement data...</div>;

  return (
    <div className="supply-branch">
      <div className="page-header">
        <h1>Procurement Workflow Dashboard</h1>
        <p>Stage 1 + Stage 2 workflow actions and reporting</p>
      </div>

      <div className="action-buttons mb-2">
        <Button onClick={loadData} disabled={actionLoading}>
          Refresh Data
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {canStartJobs && (
        <Card>
          <h2 className="section-title">Approved Requests (No Job Yet)</h2>

          {approvedRequests.length === 0 ? (
            <p className="empty-note">
              No approved requests waiting for job creation.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Item</th>
                  <th>Department</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.request_id || request.id}</td>
                    <td>{request.item_name}</td>
                    <td>{request.department}</td>
                    <td>${request.estimated_cost}</td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => openStartJobModal(request)}
                      >
                        Start Job
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <Card>
        <h2 className="section-title">Procurement Jobs</h2>

        {jobs.length === 0 ? (
          <p className="empty-note">No jobs found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Request</th>
                <th>Method</th>
                <th>Status</th>
                <th>Assigned Clerk</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.job_number || `JOB-${job.id}`}</td>
                  <td>{job.request_id || job.purchase_request_id}</td>
                  <td>{job.procurement_method || "-"}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.assigned_clerk_name || "Not assigned"}</td>
                  <td>${job.total_amount || "0.00"}</td>
                  <td>
                    <div className="job-action-grid">
                      {canStartJobs && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAssignClerkModal(job)}
                        >
                          Assign Clerk
                        </Button>
                      )}

                      {canManageWorkflow && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openSuppliersModal(job)}
                        >
                          Suppliers
                        </Button>
                      )}

                      {canManageWorkflow && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => sendToTec(job)}
                          disabled={actionLoading}
                        >
                          Send TEC
                        </Button>
                      )}

                      {canManageWorkflow && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openTecModal(job)}
                        >
                          TEC Entry
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCommitteeReport(job)}
                      >
                        Report
                      </Button>

                      {canManageWorkflow && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => routeToCommittee(job)}
                        >
                          Route Committee
                        </Button>
                      )}

                      {canCommitteeDecide && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => openCommitteeDecisionModal(job)}
                        >
                          Committee Decision
                        </Button>
                      )}

                      {canStartJobs && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => openPurchaseOrderModal(job)}
                        >
                          Generate PO
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openPurchaseOrdersList(job)}
                      >
                        Purchase Orders
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {canViewReports && (
        <Card>
          <h2 className="section-title">Quarterly / Annual Reports</h2>

          <div className="report-filters">
            <Input
              label="Year"
              type="number"
              min="2000"
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
            />

            <Select
              label="Quarter"
              value={reportQuarter}
              onChange={(e) => setReportQuarter(e.target.value)}
              options={[
                { label: "Q1", value: "1" },
                { label: "Q2", value: "2" },
                { label: "Q3", value: "3" },
                { label: "Q4", value: "4" },
              ]}
            />
          </div>

          <div className="action-buttons">
            <Button onClick={loadQuarterlyReport} disabled={actionLoading}>
              Load Quarterly Report
            </Button>
            <Button
              variant="secondary"
              onClick={loadAnnualReport}
              disabled={actionLoading}
            >
              Load Annual Report
            </Button>
          </div>

          {quarterlyReport && (
            <div className="report-block">
              <h3>Quarterly Report Result</h3>
              <pre>{JSON.stringify(quarterlyReport, null, 2)}</pre>
            </div>
          )}

          {annualReport && (
            <div className="report-block">
              <h3>Annual Report Result</h3>
              <pre>{JSON.stringify(annualReport, null, 2)}</pre>
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen && modalType === "start"}
        onClose={closeModal}
        title="Start Procurement Job"
      >
        <Select
          label="Procurement Method"
          options={PROCUREMENT_METHODS}
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
        />

        <div className="modal-actions">
          <Button
            onClick={startJob}
            disabled={!selectedMethod || actionLoading}
          >
            {actionLoading ? "Starting..." : "Start Job"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "assign-clerk"}
        onClose={closeModal}
        title="Assign Subject Clerk"
      >
        <p className="mb-2">
          Job: <strong>{selectedJob?.job_number || `JOB-${selectedJob?.id}`}</strong>
        </p>

        <Select
          label="Subject Clerk"
          value={selectedClerkId}
          onChange={(e) => setSelectedClerkId(e.target.value)}
          options={subjectClerks.map((clerk) => ({
            label: `${clerk.full_name} (${clerk.email})`,
            value: String(clerk.id),
          }))}
        />

        <div className="modal-actions">
          <Button
            onClick={submitAssignClerk}
            disabled={!selectedClerkId || actionLoading}
          >
            {actionLoading ? "Assigning..." : "Assign Clerk"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "suppliers"}
        onClose={closeModal}
        title="Supplier Category and Selection"
      >
        <Select
          label="Supplier Category"
          options={SUPPLIER_CATEGORIES}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />

        <div className="action-buttons">
          <Button
            variant="secondary"
            onClick={loadSuppliersByCategory}
            disabled={!selectedCategory || actionLoading}
          >
            {actionLoading ? "Loading..." : "Load Suppliers"}
          </Button>
        </div>

        {supplierOptions.length > 0 && (
          <div className="suppliers-list">
            {supplierOptions.map((supplier) => (
              <label key={supplier.id} className="supplier-item">
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(supplier.id)}
                  onChange={() => toggleSupplier(supplier.id)}
                />
                <span>
                  {supplier.name} ({supplier.category})
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <Button
            onClick={submitSuppliers}
            disabled={selectedSuppliers.length === 0 || actionLoading}
          >
            {actionLoading ? "Saving..." : "Save Suppliers"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "tec"}
        onClose={closeModal}
        title="TEC Decision Entry"
      >
        {tecRows.length === 0 ? (
          <p>No suppliers found for this job schedule.</p>
        ) : (
          <div className="tec-list">
            {tecRows.map((row, index) => (
              <div key={row.supplierId} className="tec-row">
                <h4>{row.supplierName}</h4>
                <Select
                  label="Decision"
                  value={row.decisionStatus}
                  onChange={(e) =>
                    updateTecRow(index, "decisionStatus", e.target.value)
                  }
                  options={TEC_DECISIONS.map((value) => ({
                    label: value,
                    value,
                  }))}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(e) =>
                    updateTecRow(index, "quantity", e.target.value)
                  }
                />
                <Input
                  label="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateTecRow(index, "unitPrice", e.target.value)
                  }
                />
                <TextArea
                  label="Remarks"
                  value={row.remarks}
                  onChange={(e) =>
                    updateTecRow(index, "remarks", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <Button
            onClick={submitTecDecisions}
            disabled={tecRows.length === 0 || actionLoading}
          >
            {actionLoading ? "Saving..." : "Save TEC Decisions"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "report"}
        onClose={closeModal}
        title="Committee Report"
      >
        {actionLoading ? (
          <p>Loading report...</p>
        ) : committeeReport ? (
          <pre className="report-json">
            {JSON.stringify(committeeReport, null, 2)}
          </pre>
        ) : (
          <p>No report available.</p>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "committee-decision"}
        onClose={closeModal}
        title="Committee Decision"
      >
        <Select
          label="Decision"
          value={committeeDecision}
          onChange={(e) => setCommitteeDecision(e.target.value)}
          options={COMMITTEE_DECISIONS.map((value) => ({
            label: value,
            value,
          }))}
        />

        <TextArea
          label="Remarks"
          value={committeeRemarks}
          onChange={(e) => setCommitteeRemarks(e.target.value)}
          placeholder="Optional committee remarks"
        />

        <div className="modal-actions">
          <Button
            onClick={submitCommitteeDecision}
            disabled={!committeeDecision || actionLoading}
          >
            {actionLoading ? "Saving..." : "Save Decision"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "generate-po"}
        onClose={closeModal}
        title="Generate Purchase Orders"
      >
        <Input
          label="Delivery Location"
          value={poDeliveryLocation}
          onChange={(e) => setPoDeliveryLocation(e.target.value)}
          placeholder="Delivery location / service location"
          required
        />

        <Input
          label="Delivery Deadline"
          type="date"
          value={poDeliveryDeadline}
          onChange={(e) => setPoDeliveryDeadline(e.target.value)}
        />

        <Input
          label="Payment Terms"
          value={poPaymentTerms}
          onChange={(e) => setPoPaymentTerms(e.target.value)}
        />

        <div className="modal-actions">
          <Button
            onClick={generatePurchaseOrders}
            disabled={!poDeliveryLocation || actionLoading}
          >
            {actionLoading ? "Generating..." : "Generate POs"}
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "purchase-orders"}
        onClose={closeModal}
        title={`Purchase Orders (${selectedJob?.job_number || ""})`}
      >
        {actionLoading ? (
          <p>Loading purchase orders...</p>
        ) : purchaseOrders.length === 0 ? (
          <p>No purchase orders found for this job.</p>
        ) : (
          <div className="po-list">
            {purchaseOrders.map((po) => (
              <Card key={po.id}>
                <div className="po-row">
                  <div>
                    <strong>{po.po_number}</strong>
                    <div>{po.supplier_name}</div>
                    <div>Amount: ${po.total_amount}</div>
                    <div>
                      Delivery Confirmed: {po.confirmed_at ? "Yes" : "Pending"}
                    </div>
                    <div>
                      Delivery Note: {po.delivery_note_number || "Not generated"}
                    </div>
                    <div>
                      Payment Voucher: {po.payment_voucher_number || "Not generated"}
                    </div>
                    <div>
                      Delivery Link:{" "}
                      <a
                        href={`/delivery/confirm/${po.confirmation_token}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        /delivery/confirm/{po.confirmation_token}
                      </a>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => generateDeliveryNote(po.id)}
                      disabled={
                        actionLoading || !po.confirmed_at || !!po.delivery_note_number
                      }
                    >
                      Delivery Note
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generatePaymentVoucher(po.id)}
                      disabled={
                        actionLoading ||
                        !po.confirmed_at ||
                        !po.delivery_note_number ||
                        !!po.payment_voucher_number
                      }
                    >
                      Payment Voucher
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
