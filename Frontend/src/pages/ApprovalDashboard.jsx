import { useState, useEffect } from "react";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import TextArea from "../components/TextArea";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import "./ApprovalDashboard.css";

export default function ApprovalDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [action, setAction] = useState("approve");

  useEffect(() => {
    console.log(
      "✅ ApprovalDashboard component mounted. User role:",
      user?.role,
    );
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      console.log("🔄 Fetching pending approvals...");

      const response = await api.get("/approvals/mine/pending");
      let data = response.data.data || response.data;

      console.log("📦 Raw approvals data:", data);

      if (Array.isArray(data)) {
        console.log("✅ Found", data.length, "pending approvals");
        setRequests(data);
      } else if (data && data.requests) {
        console.log("✅ Found", data.requests.length, "pending approvals");
        setRequests(data.requests);
      } else {
        console.log("⚠️ No pending approvals found");
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Failed to load approvals:", {
        message: err.message,
        status: err.response?.status,
      });
      setError("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalClick = (request, approvalAction) => {
    console.log(
      "📋 Opening approval dialog for request:",
      request.id,
      "with action:",
      approvalAction,
    );
    setSelectedRequest(request);
    setAction(approvalAction);
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRequest) return;

    console.log("📤 Submitting approval decision...", {
      requestId: selectedRequest.id,
      decision: action.toUpperCase(),
      hasNotes: !!notes,
    });

    setActionLoading(true);
    try {
      const payload = {
        decision: action.toUpperCase(),
        notes,
      };

      console.log("📋 Approval payload:", payload);

      await api.post(`/approvals/${selectedRequest.id}/decision`, payload);

      console.log("✅ Approval decision submitted successfully");

      setIsModalOpen(false);
      loadPendingApprovals();
      setSelectedRequest(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit approval";
      console.error("❌ Approval submission failed:", {
        requestId: selectedRequest.id,
        decision: action,
        message: errorMsg,
        fullError: err.response?.data,
      });
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading approvals...</div>;

  return (
    <div className="approval-dashboard">
      <div className="page-header">
        <h1>Approval Dashboard</h1>
        <p>Review and approve pending purchase requests</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {requests.length === 0 ? (
        <Card className="empty-state">
          <p>No requests pending your approval</p>
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Funding</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.item_name}</td>
                  <td>{req.department}</td>
                  <td>${req.estimated_cost}</td>
                  <td>{req.funding_source}</td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprovalClick(req, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleApprovalClick(req, "reject")}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleApprovalClick(req, "clarification")
                        }
                      >
                        Clarify
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${action.charAt(0).toUpperCase() + action.slice(1)} Request`}
      >
        {selectedRequest && (
          <div className="approval-modal">
            <div className="request-summary">
              <div>
                <strong>Request ID:</strong> {selectedRequest.id}
              </div>
              <div>
                <strong>Item:</strong> {selectedRequest.item_name}
              </div>
              <div>
                <strong>Amount:</strong> ${selectedRequest.estimated_cost}
              </div>
              <div>
                <strong>Funding:</strong> {selectedRequest.funding_source}
              </div>
              <div>
                <strong>Department:</strong> {selectedRequest.department}
              </div>
              <div>
                <strong>Justification:</strong>
                <p>{selectedRequest.justification}</p>
              </div>
            </div>

            <TextArea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add approval notes..."
            />

            <div className="modal-actions">
              <Button
                variant={
                  action === "approve"
                    ? "success"
                    : action === "reject"
                      ? "danger"
                      : "secondary"
                }
                onClick={handleSubmitApproval}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
