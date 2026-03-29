import { useState, useEffect } from "react";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
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
  { label: "IT Equipment", value: "IT_EQUIPMENT" },
  { label: "Electrical Equipment", value: "ELECTRICAL_EQUIPMENT" },
  { label: "Laboratory Equipment", value: "LAB_EQUIPMENT" },
  { label: "Furniture", value: "FURNITURE" },
  { label: "Office Equipment", value: "OFFICE_EQUIPMENT" },
];

export default function SupplyBranchDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("method");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log(
      "🏭 SupplyBranchDashboard component mounted. User role:",
      user?.role,
    );
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      console.log("🔄 Fetching approved jobs without procurement...");

      const response = await api.get("/requests/approved/without-jobs");
      let data = response.data.data || response.data;

      console.log("📦 Raw jobs data:", data);

      if (Array.isArray(data)) {
        console.log("✅ Found", data.length, "jobs to process");
        setJobs(data);
      } else if (data && data.requests) {
        console.log("✅ Found", data.requests.length, "jobs to process");
        setJobs(data.requests);
      } else if (data && data.jobs) {
        console.log("✅ Found", data.jobs.length, "jobs to process");
        setJobs(data.jobs);
      } else {
        console.log("⚠️ No jobs found");
        setJobs([]);
      }
    } catch (err) {
      console.error("❌ Failed to load jobs:", {
        message: err.message,
        status: err.response?.status,
      });
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (job) => {
    console.log("🔧 Opening method selection for job:", job.id);
    setSelectedJob(job);
    setModalType("method");
    setSelectedMethod("");
    setIsModalOpen(true);
  };

  const handleSelectCategory = (job) => {
    console.log("📦 Opening category selection for job:", job.id);
    setSelectedJob(job);
    setModalType("category");
    setSelectedCategory("");
    setSuppliers([]);
    setSelectedSuppliers([]);
    setIsModalOpen(true);
  };

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    console.log("🏷️ Category selected:", category);
    setSelectedCategory(category);

    if (category) {
      try {
        console.log("🔄 Fetching suppliers for category:", category);

        const response = await api.get("/procurement/suppliers", {
          params: { category },
        });
        console.log("✅ Found suppliers:", response.data);
        let data = response.data.data || response.data;
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Failed to load suppliers:", err.message);
        setError("Failed to load suppliers");
      }
    }
  };

  const toggleSupplier = (supplierId) => {
    console.log("✓ Toggling supplier:", supplierId);
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId],
    );
  };

  const handleSubmitMethod = async () => {
    if (!selectedJob || !selectedMethod) return;

    console.log("📤 Submitting procurement method...", {
      jobId: selectedJob.id,
      method: selectedMethod,
    });

    setActionLoading(true);
    try {
      const payload = { method: selectedMethod };
      console.log("📋 Method payload:", payload);

      await api.post(`/procurement/${selectedJob.id}/method`, payload);

      console.log("✅ Procurement method set successfully");
      setIsModalOpen(false);
      loadJobs();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to set procurement method";
      console.error("❌ Method submission failed:", {
        jobId: selectedJob.id,
        method: selectedMethod,
        message: errorMsg,
      });
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitSuppliers = async () => {
    if (!selectedJob || selectedSuppliers.length === 0) return;

    console.log("📤 Submitting supplier selection...", {
      jobId: selectedJob.id,
      supplierIds: selectedSuppliers,
    });

    setActionLoading(true);
    try {
      const payload = { supplier_ids: selectedSuppliers };
      console.log("📋 Supplier payload:", payload);

      await api.post(`/procurement/${selectedJob.id}/suppliers`, payload);

      console.log("✅ Suppliers submitted successfully");

      setIsModalOpen(false);
      loadJobs();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to select suppliers";
      console.error("❌ Supplier submission failed:", {
        jobId: selectedJob.id,
        selectedCount: selectedSuppliers.length,
        message: errorMsg,
      });
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading jobs...</div>;

  return (
    <div className="supply-branch">
      <div className="page-header">
        <h1>Supply Branch Dashboard</h1>
        <p>Manage procurement processes and supplier selection</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {jobs.length === 0 ? (
        <Card className="empty-state">
          <p>No approved requests pending procurement</p>
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.item_name}</td>
                  <td>${job.estimated_cost}</td>
                  <td>{job.status}</td>
                  <td>
                    <div className="action-buttons">
                      {!job.procurement_method && (
                        <Button
                          size="sm"
                          onClick={() => handleSelectMethod(job)}
                        >
                          Method
                        </Button>
                      )}
                      {job.procurement_method && !job.supplier_category && (
                        <Button
                          size="sm"
                          onClick={() => handleSelectCategory(job)}
                        >
                          Category
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen && modalType === "method"}
        onClose={() => setIsModalOpen(false)}
        title="Select Procurement Method"
      >
        <div className="modal-content">
          <Select
            label="Procurement Method"
            options={PROCUREMENT_METHODS}
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          />
          <div className="modal-actions">
            <Button
              onClick={handleSubmitMethod}
              disabled={actionLoading || !selectedMethod}
            >
              {actionLoading ? "Setting..." : "Confirm"}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen && modalType === "category"}
        onClose={() => setIsModalOpen(false)}
        title="Select Supplier Category and Suppliers"
      >
        <div className="modal-content">
          <Select
            label="Supplier Category"
            options={SUPPLIER_CATEGORIES}
            value={selectedCategory}
            onChange={handleCategoryChange}
          />

          {suppliers.length > 0 && (
            <div className="suppliers-list">
              <h3>Available Suppliers</h3>
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="supplier-item">
                  <input
                    type="checkbox"
                    id={`supplier-${supplier.id}`}
                    checked={selectedSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                  />
                  <label htmlFor={`supplier-${supplier.id}`}>
                    {supplier.name} ({supplier.category})
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <Button
              onClick={handleSubmitSuppliers}
              disabled={actionLoading || selectedSuppliers.length === 0}
            >
              {actionLoading ? "Saving..." : "Confirm Selection"}
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
