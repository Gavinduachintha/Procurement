import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requestApi } from "../api/endpoints";
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
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const response = await requestApi.get(id);
      setRequest(response.data);
    } catch (err) {
      setError("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSpecification = async (action) => {
    setActionLoading(true);
    try {
      await requestApi.confirmSpecification(id, { action });
      setRequest((prev) => ({ ...prev, status: "APPROVAL_PENDING" }));
      Alert.success = "Specification confirmed successfully";
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to confirm specification",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading request...</div>;
  if (error) return <Alert type="error">{error}</Alert>;
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

      {request.status === "SPEC_CHECKED" &&
        request.requested_by === user?.id && (
          <Card className="action-card">
            <div className="detail-section">
              <h2>Specification Review Complete</h2>
              <p>
                The specification checker has reviewed your specifications.
                Please confirm to proceed.
              </p>
              <div className="action-buttons">
                <Button
                  variant="success"
                  onClick={() => handleConfirmSpecification("ACCEPT")}
                  disabled={actionLoading}
                >
                  Accept Specifications
                </Button>
                <Button
                  variant="warning"
                  onClick={() =>
                    handleConfirmSpecification("REQUEST_MODIFICATION")
                  }
                  disabled={actionLoading}
                >
                  Request Modification
                </Button>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
