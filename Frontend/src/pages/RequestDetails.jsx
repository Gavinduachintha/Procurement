import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./RequestDetails.css";

export default function RequestDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log("📄 RequestDetails component mounted for request ID:", id);
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      console.log("🔄 Fetching request details for ID:", id);

      const response = await api.get(`/requests/${id}`);
      const data = response.data.data || response.data;

      console.log("✅ Request loaded:", {
        id: data.id,
        status: data.status,
        itemName: data.item_name,
        requester: data.requested_by,
      });

      setRequest(data);
    } catch (err) {
      console.error("❌ Failed to load request:", {
        requestId: id,
        message: err.message,
        status: err.response?.status,
      });
      setError("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSpecification = async (action) => {
    console.log(
      "🔐 Confirming specification with action:",
      action,
      "for request:",
      id,
    );

    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      console.log("📤 Sending confirmation request...");

      await api.post(`/specifications/${id}/requester-confirmation`, {
        action,
      });

      console.log("✅ Specification confirmed successfully");

      const nextStatus =
        action === "ACCEPT" ? "APPROVED" : "SPEC_REWORK_REQUESTED";
      setRequest((prev) => ({ ...prev, status: nextStatus }));
      setSuccess(
        action === "ACCEPT"
          ? "Specifications accepted. Request is now approved and ready for procurement."
          : "Modification requested. The specification checker has been notified.",
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to confirm specification";
      console.error("❌ Confirmation failed:", {
        action,
        requestId: id,
        message: errorMsg,
      });
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading request...</div>;
  if (!request) return <Alert type="error">Request not found</Alert>;

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: "#3498db",
      SPEC_CHECKING: "#f39c12",
      SPEC_CHECKED: "#3498db",
      SPEC_REWORK_REQUESTED: "#f39c12",
      APPROVAL_PENDING: "#f39c12",
      APPROVED: "#27ae60",
      REJECTED: "#e74c3c",
      CLARIFICATION_REQUESTED: "#f39c12",
      SPEC_RETURNED_TO_REQUESTER: "#f39c12",
      SPEC_REVIEW_PENDING: "#f39c12",
      IN_PROCUREMENT: "#3498db",
      COMPLETED: "#27ae60",
    };
    return colors[status] || "#7f8c8d";
  };

  return (
    <div className="request-details">
      <div className="page-header">
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          ← Back
        </Button>
        <h1>Request Details</h1>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="details-grid">
        <Card>
          <div className="detail-section">
            <h2>Request Information</h2>
            <div className="detail-row">
              <div className="detail-label">Request ID</div>
              <div className="detail-value">{request.id}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Status</div>
              <div className="detail-value">
                <span
                  className="badge"
                  style={{
                    backgroundColor: getStatusColor(request.status),
                    color: "white",
                  }}
                >
                  {request.status}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Submitted By</div>
              <div className="detail-value">{request.requested_by_name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Department</div>
              <div className="detail-value">{request.department}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Submitted Date</div>
              <div className="detail-value">
                {new Date(request.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="detail-section">
            <h2>Item Information</h2>
            <div className="detail-row">
              <div className="detail-label">Item Name</div>
              <div className="detail-value">{request.item_name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Quantity</div>
              <div className="detail-value">{request.quantity}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Estimated Cost</div>
              <div className="detail-value">${request.estimated_cost}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Funding Source</div>
              <div className="detail-value">{request.funding_source}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Required Date</div>
              <div className="detail-value">
                {new Date(request.required_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="detail-section">
          <h2>Full Description</h2>
          <p>{request.item_description}</p>
        </div>
      </Card>

      <Card>
        <div className="detail-section">
          <h2>Technical Specifications</h2>
          <p>{request.technical_specifications}</p>
        </div>
      </Card>

      <Card>
        <div className="detail-section">
          <h2>Justification</h2>
          <p>{request.justification}</p>
        </div>
      </Card>

      {request.status === "APPROVED" && request.requester_id === user?.id && (
        <Card className="action-card">
          <div className="detail-section">
            <h2>✅ Request Approved for Procurement</h2>
            <p>
              Your request has been approved and is now with the Supply Branch
              for procurement.
            </p>
          </div>
        </Card>
      )}

      {request.status === "SPEC_RETURNED_TO_REQUESTER" &&
        request.requester_id === user?.id && (
          <Card className="action-card">
            <div className="detail-section">
              <h2>Specification Review Returned</h2>
              <p>
                The checker has reviewed your specifications. Choose one option
                to continue.
              </p>
              {request.checked_specifications && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong>Reviewed Specification:</strong>
                  <p>{request.checked_specifications}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  variant="success"
                  onClick={() => handleConfirmSpecification("ACCEPT")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Submitting..." : "Accept and Continue"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleConfirmSpecification("REQUEST_MODIFICATION")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Submitting..." : "Request Modification"}
                </Button>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
