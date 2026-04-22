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
import universityLogo from "../../assets/logo.png";
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

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => lkrFormatter.format(Number(formatAmount(value)));

const formatDateTime = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString();
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
};

const getSafeFilePart = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "supplier";

const getMethodLabel = (methodCode) => {
  if (!methodCode) {
    return "N/A";
  }

  const method = PROCUREMENT_METHODS.find(
    (entry) => entry.value === methodCode,
  );
  return method ? method.label : methodCode;
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

  const openDetailsModal = (job) => {
    setSelectedJob(job);
    setModalType("details");
    setIsModalOpen(true);
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
      const selectedSupplierIdSet = new Set(normalizedSupplierIds);
      const suppliersById = new Map(
        suppliersForCategory
          .map((supplier) => [normalizeId(supplier.id), supplier])
          .filter(([id]) => id !== null),
      );

      const backendRecipients = Array.isArray(letters.recipients)
        ? letters.recipients
        : [];

      const recipientsFromBackend = backendRecipients
        .map((recipient) => {
          const recipientId = normalizeId(
            recipient?.id ?? recipient?.supplier_id ?? recipient?.supplierId,
          );

          if (recipientId === null || !selectedSupplierIdSet.has(recipientId)) {
            return null;
          }

          const categorySupplier = suppliersById.get(recipientId) || {};
          return {
            ...categorySupplier,
            ...recipient,
            id: recipientId,
          };
        })
        .filter(Boolean);

      const recipientsFromSelectedCategory = suppliersForCategory.filter((supplier) =>
        selectedSupplierIdSet.has(normalizeId(supplier.id)),
      );

      const recipients =
        recipientsFromBackend.length > 0
          ? recipientsFromBackend
          : recipientsFromSelectedCategory;

      if (recipients.length === 0) {
        setError("No valid selected suppliers found for letter generation.");
        return;
      }

      const methodLabel = getMethodLabel(selectedJob.procurement_method);
      const jobNumberWithMethod = `${selectedJob.job_number || selectedJob.id} (${methodLabel})`;
      const contactInformation = [
        user?.full_name ? `Officer: ${user.full_name}` : null,
        user?.email ? `Email: ${user.email}` : null,
        "Supply Branch, Wayamba University of Sri Lanka, Kuliyapitiya.",
      ]
        .filter(Boolean)
        .join(" | ");

      for (const recipient of recipients) {
        const blob = await pdf(
          <QuotationRequestLetter
            supplier={recipient}
            logoSrc={universityLogo}
            universityName="WAYAMBA UNIVERSITY OF SRI LANKA"
            location="Kuliyapitiya."
            letterTitle="PURCHASE ORDER FOR STORES & SERVICES"
            jobNumberWithMethod={jobNumberWithMethod}
            itemDescription={
              selectedJob.item_description || selectedJob.item_name || "N/A"
            }
            technicalSpecifications={
              selectedJob.technical_specifications || "N/A"
            }
            deadline={submissionDeadline}
            contactInformation={contactInformation}
          />,
        ).toBlob();

        const supplierFilePart = getSafeFilePart(
          recipient?.name || recipient?.email || recipient?.id,
        );
        const fileName = `po-letter-${selectedJob.job_number || selectedJob.id}-${supplierFilePart}.pdf`;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);

        // Small delay helps browsers process multiple download triggers.
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      setSuccess(`PO letters downloaded for ${recipients.length} supplier(s).`);
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
                    <td>{formatCurrency(request.estimated_cost)}</td>
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
                    {formatCurrency(
                      job.display_amount ||
                        job.total_amount ||
                        job.request_amount,
                    )}
                  </td>
                  <td>
                    <div className="job-action-grid">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDetailsModal(job)}
                      >
                        View Details
                      </Button>

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
        isOpen={isModalOpen && modalType === "details"}
        onClose={closeModal}
        title={`Job Details - ${selectedJob?.job_number || `JOB-${selectedJob?.id || ""}`}`}
      >
        {(() => {
          const requestItems = toArray(selectedJob?.request_items);
          const selectedSuppliers = toArray(selectedJob?.selected_suppliers);
          const fallbackItems =
            requestItems.length > 0
              ? requestItems
              : [
                  {
                    line_no: 1,
                    item_type: selectedJob?.item_type,
                    item_name: selectedJob?.item_name,
                    item_description: selectedJob?.item_description,
                    technical_specifications:
                      selectedJob?.technical_specifications,
                    quantity: selectedJob?.quantity,
                    estimated_cost:
                      selectedJob?.request_amount ||
                      selectedJob?.display_amount,
                    funding_source: selectedJob?.funding_source,
                    department: selectedJob?.department,
                    required_date: selectedJob?.required_date,
                  },
                ];

          return (
            <div className="job-details-screen">
              <div className="job-details-grid">
                <div className="job-details-block">
                  <h3>Job Information</h3>
                  <p>
                    <strong>Job Number:</strong>{" "}
                    {selectedJob?.job_number ||
                      `JOB-${selectedJob?.id || "N/A"}`}
                  </p>
                  <p>
                    <strong>Job ID:</strong> {selectedJob?.id || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedJob?.status || "N/A"}
                  </p>
                  <p>
                    <strong>Procurement Method:</strong>{" "}
                    {getMethodLabel(selectedJob?.procurement_method)}
                  </p>
                  <p>
                    <strong>Supplier Category:</strong>{" "}
                    {selectedJob?.supplier_category || "N/A"}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {formatDateTime(selectedJob?.created_at)}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {formatDateTime(selectedJob?.updated_at)}
                  </p>
                </div>

                <div className="job-details-block">
                  <h3>Request Information</h3>
                  <p>
                    <strong>Request ID:</strong>{" "}
                    {selectedJob?.request_id ||
                      selectedJob?.purchase_request_id ||
                      "N/A"}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {selectedJob?.department || "N/A"}
                  </p>
                  <p>
                    <strong>Item Name:</strong>{" "}
                    {selectedJob?.item_name || "N/A"}
                  </p>
                  <p>
                    <strong>Assigned Clerk:</strong>{" "}
                    {selectedJob?.assigned_clerk_name || "Not assigned"}
                  </p>
                  <p>
                    <strong>Total / Estimated Amount:</strong>{" "}
                    {formatCurrency(
                      selectedJob?.display_amount ||
                        selectedJob?.total_amount ||
                        selectedJob?.request_amount,
                    )}
                  </p>
                  <p>
                    <strong>Request Status:</strong>{" "}
                    {selectedJob?.request_status || "N/A"}
                  </p>
                  <p>
                    <strong>Request Item Type:</strong>{" "}
                    {selectedJob?.item_type || "N/A"}
                  </p>
                  <p>
                    <strong>Request Quantity:</strong>{" "}
                    {selectedJob?.quantity ?? "N/A"}
                  </p>
                  <p>
                    <strong>Funding Source:</strong>{" "}
                    {selectedJob?.funding_source || "N/A"}
                  </p>
                  <p>
                    <strong>Required Date:</strong>{" "}
                    {formatDate(selectedJob?.required_date)}
                  </p>
                </div>
              </div>

              <div className="job-details-block">
                <h3>Item Description</h3>
                <div className="job-details-text">
                  {selectedJob?.item_description ||
                    selectedJob?.item_name ||
                    "N/A"}
                </div>
              </div>

              <div className="job-details-block">
                <h3>Technical Specifications</h3>
                <div className="job-details-text">
                  {selectedJob?.technical_specifications || "N/A"}
                </div>
              </div>

              <div className="job-details-block">
                <h3>Checked Specifications</h3>
                <div className="job-details-text">
                  {selectedJob?.checked_specifications || "N/A"}
                </div>
              </div>

              <div className="job-details-block">
                <h3>Justification</h3>
                <div className="job-details-text">
                  {selectedJob?.justification || "N/A"}
                </div>
              </div>

              <div className="job-details-block">
                <h3>Products / Request Line Items</h3>
                <div className="job-details-table-wrap">
                  <table className="table job-details-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Type</th>
                        <th>Item Name</th>
                        <th>Description</th>
                        <th>Technical Specs</th>
                        <th>Qty</th>
                        <th>Est. Cost</th>
                        <th>Funding</th>
                        <th>Department</th>
                        <th>Required Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fallbackItems.map((item, index) => (
                        <tr
                          key={`${item?.id || item?.line_no || "line"}-${index}`}
                        >
                          <td>{item?.line_no ?? index + 1}</td>
                          <td>{item?.item_type || "N/A"}</td>
                          <td>{item?.item_name || "N/A"}</td>
                          <td>{item?.item_description || "N/A"}</td>
                          <td>{item?.technical_specifications || "N/A"}</td>
                          <td>{item?.quantity ?? "N/A"}</td>
                          <td>{formatCurrency(item?.estimated_cost)}</td>
                          <td>{item?.funding_source || "N/A"}</td>
                          <td>{item?.department || "N/A"}</td>
                          <td>{formatDate(item?.required_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="job-details-block">
                <h3>Selected Suppliers</h3>
                {selectedSuppliers.length === 0 ? (
                  <p className="empty-note">
                    No suppliers selected for this job yet.
                  </p>
                ) : (
                  <div className="job-details-table-wrap">
                    <table className="table job-details-table">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Email</th>
                          <th>Category</th>
                          <th>Quoted Price</th>
                          <th>Quotation Received</th>
                          <th>Submission Date</th>
                          <th>Evaluation Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSuppliers.map((supplier, index) => (
                          <tr key={`${supplier?.id || "supplier"}-${index}`}>
                            <td>{supplier?.name || "N/A"}</td>
                            <td>{supplier?.email || "N/A"}</td>
                            <td>{supplier?.category || "N/A"}</td>
                            <td>{formatCurrency(supplier?.quoted_price)}</td>
                            <td>
                              {supplier?.quotation_received ? "Yes" : "No"}
                            </td>
                            <td>{formatDate(supplier?.submission_date)}</td>
                            <td>{supplier?.evaluation_result || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <Button variant="secondary" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

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
