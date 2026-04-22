import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
import Input from "../components/Input";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import QuotationRequestLetter from "../components/QuotationRequestLetter";
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

const parseData = (response) => response.data?.data || response.data;

const getDefaultSubmissionDeadline = (daysAhead = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
};

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
};

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
  const [submissionDeadline, setSubmissionDeadline] = useState(
    getDefaultSubmissionDeadline(),
  );
  const [selectedMethod, setSelectedMethod] = useState("");
  const [subjectClerks, setSubjectClerks] = useState([]);
  const [selectedClerkId, setSelectedClerkId] = useState("");
  const [clerkAssignHint, setClerkAssignHint] = useState("");
  const [suppliersSaved, setSuppliersSaved] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const canManageWorkflow = ["SUPPLY_BRANCH", "SUBJECT_CLERK"].includes(
    user?.role,
  );
  const canStartJobs = user?.role === "SUPPLY_BRANCH";

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
    setSubmissionDeadline(getDefaultSubmissionDeadline());
    setSuppliersSaved(false);
    setIsModalOpen(true);
  };

  const openAssignClerkModal = async (job) => {
    setSelectedJob(job);
    setModalType("assign-clerk");
    setSubjectClerks([]);
    setSelectedClerkId(
      job.assigned_clerk_id ? String(job.assigned_clerk_id) : "",
    );
    setClerkAssignHint("");
    setIsModalOpen(true);
    setActionLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/users", {
        params: { role: "SUBJECT_CLERK" },
      });
      const data = parseData(response);

      const clerks = Array.isArray(data) ? data : [];

      if (!job.procurement_method) {
        setSubjectClerks(clerks);
        setClerkAssignHint(
          "Set procurement method first. Then assign a method specialist clerk.",
        );
        return;
      }

      const jobsWithClerk = jobs.filter((entry) => entry.assigned_clerk_id);
      const currentMethod = job.procurement_method;
      const existingSpecialistIds = [
        ...new Set(
          jobsWithClerk
            .filter((entry) => entry.procurement_method === currentMethod)
            .map((entry) => String(entry.assigned_clerk_id)),
        ),
      ];

      const clerkMethodMap = jobsWithClerk.reduce((acc, entry) => {
        const key = String(entry.assigned_clerk_id);
        if (!acc[key]) {
          acc[key] = new Set();
        }

        if (entry.procurement_method) {
          acc[key].add(entry.procurement_method);
        }

        return acc;
      }, {});

      const filtered = clerks.filter((clerk) => {
        const clerkId = String(clerk.id);

        if (existingSpecialistIds.length > 0) {
          return existingSpecialistIds.includes(clerkId);
        }

        const methods = clerkMethodMap[clerkId]
          ? Array.from(clerkMethodMap[clerkId])
          : [];

        return (
          methods.length === 0 || methods.every((m) => m === currentMethod)
        );
      });

      setSubjectClerks(filtered);

      if (existingSpecialistIds.length > 0) {
        setClerkAssignHint(
          `${currentMethod} already has a designated specialist. Only that clerk can be assigned.`,
        );
      } else {
        setClerkAssignHint(
          `Assign a ${currentMethod} specialist clerk. This clerk will be restricted to ${currentMethod} jobs.`,
        );
      }

      if (!filtered.some((clerk) => String(clerk.id) === selectedClerkId)) {
        setSelectedClerkId(filtered[0] ? String(filtered[0].id) : "");
      }
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
    setSuppliersSaved(false);

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

  const handleSupplierCategoryChange = (event) => {
    const nextCategory = event.target.value;
    setSelectedCategory(nextCategory);
    setSupplierOptions([]);
    setSelectedSuppliers([]);
    setSuppliersSaved(false);
  };

  const syncCategoryAndGetSuppliers = async () => {
    const response = await api.post(
      `/procurement/jobs/${selectedJob.id}/select-category`,
      {
        category: selectedCategory,
      },
    );

    const data = parseData(response);
    const suppliers = Array.isArray(data) ? data : [];
    setSupplierOptions(suppliers);
    return suppliers;
  };

  const toggleSupplier = (supplierId) => {
    const normalizedId = normalizeId(supplierId);
    if (normalizedId === null) {
      return;
    }

    setSuppliersSaved(false);
    setSelectedSuppliers((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const submitSuppliers = async () => {
    if (!selectedJob || !selectedSuppliers.length) return;

    if (!selectedCategory) {
      setError("Select supplier category before saving suppliers");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const suppliersForCategory = await syncCategoryAndGetSuppliers();
      const validIds = new Set(
        suppliersForCategory
          .map((supplier) => normalizeId(supplier.id))
          .filter((id) => id !== null),
      );
      const normalizedSupplierIds = selectedSuppliers
        .map((value) => normalizeId(value))
        .filter((value) => value !== null);
      const invalidSelection = normalizedSupplierIds.some(
        (id) => !validIds.has(id),
      );

      if (invalidSelection) {
        setSelectedSuppliers(
          normalizedSupplierIds.filter((id) => validIds.has(id)),
        );
        setError(
          "Supplier list changed for this category. Please reselect suppliers and try again.",
        );
        return;
      }

      await api.post(`/procurement/${selectedJob.id}/suppliers`, {
        supplierIds: normalizedSupplierIds,
      });

      setSuppliersSaved(true);
      setSuccess(
        "Suppliers selected successfully. You can now download the PO letter.",
      );
      await loadData();
    } catch (err) {
      setSuppliersSaved(false);
      setError(err.response?.data?.message || "Failed to select suppliers");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadPoLetter = async () => {
    if (!selectedJob) {
      return;
    }

    if (!suppliersSaved) {
      setError("Save suppliers before downloading the PO letter");
      return;
    }

    if (!selectedCategory) {
      setError("Select supplier category before generating letters");
      return;
    }

    if (!selectedSuppliers.length) {
      setError("Select at least one supplier before generating letters");
      return;
    }

    if (!submissionDeadline) {
      setError("Submission deadline is required");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const suppliersForCategory = await syncCategoryAndGetSuppliers();
      const validIds = new Set(
        suppliersForCategory
          .map((supplier) => normalizeId(supplier.id))
          .filter((id) => id !== null),
      );
      const normalizedSupplierIds = selectedSuppliers
        .map((value) => normalizeId(value))
        .filter((value) => value !== null);
      const invalidSelection = normalizedSupplierIds.some(
        (id) => !validIds.has(id),
      );

      if (invalidSelection) {
        setSelectedSuppliers(
          normalizedSupplierIds.filter((id) => validIds.has(id)),
        );
        setError(
          "Supplier list changed for this category. Please reselect suppliers and try again.",
        );
        return;
      }

      await api.post(`/procurement/${selectedJob.id}/suppliers`, {
        supplierIds: normalizedSupplierIds,
      });

      const lettersResponse = await api.post(
        `/procurement/jobs/${selectedJob.id}/generate-letters`,
        {
          submissionDeadline,
        },
      );

      const letters = parseData(lettersResponse) || {};
      const recipients = Array.isArray(letters.recipients)
        ? letters.recipients
        : suppliersForCategory.filter((supplier) =>
            normalizedSupplierIds.includes(normalizeId(supplier.id)),
          );

      const letterContent =
        letters.letterContent ||
        [
          "University Procurement Unit",
          `Job Number: ${selectedJob.job_number || selectedJob.id}`,
          `Request ID: ${selectedJob.request_id || selectedJob.purchase_request_id || "N/A"}`,
          `Item: ${selectedJob.item_name || "N/A"}`,
          `Amount: ${formatAmount(selectedJob.display_amount || selectedJob.total_amount || selectedJob.request_amount)}`,
          `Submission Deadline: ${submissionDeadline}`,
        ].join("\n");

      const blob = await pdf(
        <QuotationRequestLetter
          suppliers={recipients}
          content={letterContent}
          deadline={submissionDeadline}
          amount={formatAmount(
            selectedJob.display_amount ||
              selectedJob.total_amount ||
              selectedJob.request_amount,
          )}
        />,
      ).toBlob();

      const fileName = `po-letter-${selectedJob.job_number || selectedJob.id}.pdf`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setSuccess("PO letter downloaded successfully.");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download PO letter");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      JOB_CREATED: "badge-info",
      CLERK_ASSIGNED: "badge-info",
      CATEGORY_SELECTED: "badge-warning",
      QUOTATION_REQUESTS_GENERATED: "badge-success",
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
        <p>Stage 1 workflow actions</p>
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
                  <td>
                    $
                    {formatAmount(
                      job.display_amount ||
                        job.total_amount ||
                        job.request_amount,
                    )}
                  </td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

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
          Job:{" "}
          <strong>{selectedJob?.job_number || `JOB-${selectedJob?.id}`}</strong>
        </p>

        {selectedJob?.procurement_method && (
          <p className="mb-2">
            Method: <strong>{selectedJob.procurement_method}</strong>
          </p>
        )}

        {clerkAssignHint && <p className="mb-2">{clerkAssignHint}</p>}

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
          onChange={handleSupplierCategoryChange}
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
                  checked={selectedSuppliers.includes(normalizeId(supplier.id))}
                  onChange={() => toggleSupplier(supplier.id)}
                />
                <span>
                  {supplier.name} ({supplier.category})
                </span>
              </label>
            ))}
          </div>
        )}

        <Input
          label="Quotation Submission Deadline *"
          type="date"
          value={submissionDeadline}
          onChange={(e) => setSubmissionDeadline(e.target.value)}
        />

        <div className="modal-actions">
          <Button
            onClick={submitSuppliers}
            disabled={selectedSuppliers.length === 0 || actionLoading}
          >
            {actionLoading ? "Saving..." : "Save Suppliers"}
          </Button>
          {suppliersSaved && (
            <Button
              variant="success"
              onClick={downloadPoLetter}
              disabled={
                !selectedCategory || !submissionDeadline || actionLoading
              }
            >
              {actionLoading ? "Downloading..." : "Download PO Letter"}
            </Button>
          )}
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
