import { useState, useEffect } from "react";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import TextArea from "../components/TextArea";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import "./SpecificationReview.css";

export default function SpecificationReview({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [requestDetailsLoading, setRequestDetailsLoading] = useState(false);

  useEffect(() => {
  const [detailsLoading, setDetailsLoading] = useState(false);
      "🔍 SpecificationReview component mounted. User role:",
      user?.role,
    );
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      console.log("🔄 Fetching specification reviews...");

      const response = await api.get("/requests/assigned/specification");
      console.log("📦 Full API Response:", response);

      let data = response.data.data || response.data;

      console.log("📦 Raw reviews data:", data);
      console.log("📦 Data type:", typeof data);
      console.log("📦 Is Array:", Array.isArray(data));

      if (Array.isArray(data)) {
        console.log("✅ Found", data.length, "specifications to review");
        console.log("📋 First item sample:", data[0]);
        setRequests(data);
      } else if (data && data.requests) {
        console.log(
          "✅ Found",
          data.requests.length,
          "specifications to review",
        );
        setRequests(data.requests);
      } else {
        console.log("⚠️ No specifications found");
        console.log("📦 Unexpected data structure:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Failed to load reviews:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError("Failed to load specification reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = async (request) => {
    console.log("👁️ Opening review modal for request:", request.id);
    setRequestDetailsLoading(true);

    try {
      const response = await api.get(`/requests/${request.id}`);
      const details = response.data?.data || response.data;
    setDetailsLoading(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to load request details";
      setError(errorMsg);
      setSelectedRequest(request);
    } finally {
      setRequestDetailsLoading(false);
    }

    setReviewNotes("");
    setIsModalOpen(true);
      setDetailsLoading(false);

  const formatCurrency = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "-";
  };

  const getReviewItems = () => {
    if (!selectedRequest) {
      return [];
    }

    if (Array.isArray(selectedRequest.items) && selectedRequest.items.length > 0) {
      return selectedRequest.items;
    }

    return [
      {
        line_no: 1,
        item_type: selectedRequest.item_type,
        item_name: selectedRequest.item_name,
        item_description: selectedRequest.item_description,
        technical_specifications: selectedRequest.technical_specifications,
        quantity: selectedRequest.quantity,
        estimated_cost: selectedRequest.estimated_cost,
        funding_source: selectedRequest.funding_source,
        department: selectedRequest.department,
        required_date: selectedRequest.required_date,
      },
    ];
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    console.log("📤 Submitting review for request:", selectedRequest.id);

    setActionLoading(true);
    try {
      const payload = { notes: reviewNotes };
      console.log("📋 Review payload:", payload);

      await api.post(`/specifications/${selectedRequest.id}/review`, payload);

      console.log("✅ Review submitted successfully");

      setIsModalOpen(false);
      loadReviews();
      setSelectedRequest(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to submit review";
      console.error("❌ Review submission failed:", {
        requestId: selectedRequest.id,
        message: errorMsg,
      });
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading reviews...</div>;

  return (
    <div className="spec-review">
      <div className="page-header">
        <h1>Specification Review</h1>
        <p>Review technical specifications for pending requests</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {requests.length === 0 ? (
        <Card className="empty-state">
          <p>No specifications to review</p>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: "1rem", color: "#666" }}>
            Found {requests.length} specification(s) to review
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              marginBottom: "1rem",
            }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Item</th>
                  <th>Department</th>
                  <th>Submitted By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.request_id}</td>
                    <td>{req.item_name}</td>
                    <td>{req.department}</td>
                    <td>{req.requested_by_name}</td>
                    <td>
                      <Button size="sm" onClick={() => handleReviewClick(req)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Review Specifications"
      >
        {requestDetailsLoading ? (
          <div className="loading-state">Loading request details...</div>
        ) : (
          selectedRequest && (
          <div className="review-modal">
            <div className="spec-info">
              <div>
                <strong>Request ID:</strong>{" "}
                {selectedRequest.request_id || "N/A"}
              </div>
              <div>
                <strong>Total Items:</strong> {getReviewItems().length}
              </div>
              <div>
                <strong>Submitted By:</strong>{" "}
                {selectedRequest.requested_by_name || "Unknown"}
              </div>
            </div>

            <div className="review-items-table-wrap">
              <table className="review-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>Technical Specifications</th>
                    <th>Funding Source</th>
                    <th>Department</th>
                    <th>Required Date</th>
                    <th>Qty</th>
                    <th>Estimated Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {getReviewItems().map((item, index) => (
                    <tr key={`review-item-${item.line_no || index + 1}`}>
                      <td>{item.line_no || index + 1}</td>
                      <td>{item.item_type || "-"}</td>
                      <td>{item.item_name || "-"}</td>
                      <td>{item.item_description || "-"}</td>
                      <td>{item.technical_specifications || "-"}</td>
                      <td>{item.funding_source || "-"}</td>
                      <td>{item.department || "-"}</td>
                      <td>
                        {item.required_date
                          ? new Date(item.required_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{item.quantity ?? "-"}</td>
                      <td>{formatCurrency(item.estimated_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TextArea
              label="Review Notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add your technical review notes..."
            />

            <div className="modal-actions">
              <Button
                variant="success"
                onClick={handleSubmitReview}
                disabled={actionLoading}
              >
                {actionLoading ? "Submitting..." : "Approve Specifications"}
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
          )
        )}
      </Modal>
    </div>
  );
}
