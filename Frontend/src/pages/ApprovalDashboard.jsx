import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import api from "../api/client";
import Card from "../components/Card";
import Alert from "../components/Alert";
import Button from "../components/Button";
import Modal from "../components/Modal";
import "./ApprovalDashboard.css";

export default function ApprovalDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("APPROVED");
  const [comments, setComments] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  useEffect(() => {
    console.log(
      "✅ ApprovalDashboard component mounted. User role:",
      user?.role,
    );
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      console.log(
        "🔄 Fetching pending approvals for user:",
        user?.id,
        "role:",
        user?.role,
      );

      const response = await api.get("/approvals/mine/pending");
      let data = response.data.data || response.data;

      console.log("📦 Raw approvals data:", data);
      console.log("📦 Response status:", response.status);
      console.log("📦 Full response:", response);

      if (Array.isArray(data)) {
        console.log("✅ Found", data.length, "pending approvals");
        if (data.length > 0) {
          console.log("📋 First approval item:", data[0]);
        }
        setRequests(data);
      } else if (data && data.requests) {
        console.log("✅ Found", data.requests.length, "pending approvals");
        setRequests(data.requests);
      } else {
        console.log("⚠️ No pending approvals found");
        console.log("📦 Data type:", typeof data);
        setRequests([]);
      }
    } catch (err) {
      console.error("❌ Failed to load approvals:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        userId: user?.id,
      });
      setError("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const openDecisionModal = (request) => {
    setError("");
    setSuccess("");
    setSelectedRequest(request);
    setDecision("APPROVED");
    setComments("");
    setIsDecisionModalOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedRequest) {
      return;
    }

    if (
      (decision === "REJECTED" || decision === "CLARIFICATION_REQUESTED") &&
      !comments.trim()
    ) {
      setError("Comments are required for Reject or Request Clarification.");
      return;
    }

    setDecisionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/approvals/${selectedRequest.id}/decision`, {
        decision,
        comments: comments.trim(),
      });

      setSuccess("Final approval decision submitted successfully.");
      setIsDecisionModalOpen(false);
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit approval decision";
      setError(errorMsg);

      // If request state changed meanwhile (already decided/not pending), sync table.
      if (
        /not in a final approval state|already submitted|already completed/i.test(
          errorMsg,
        )
      ) {
        setIsDecisionModalOpen(false);
        setSelectedRequest(null);
        await loadPendingApprovals();
      }
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading approvals...</div>;

  return (
    <div className="approval-dashboard">
      <div className="page-header">
        <h1>Approval Dashboard</h1>
        <p>Dean / Vice Chancellor final approval stage.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Alert type="info">
        Item-level technical decisions are handled by DIRECTOR_ICT /
        MAINTENANCE_ENGINEER in Specification Review. This stage captures final
        decision only.
      </Alert>

      {requests.length === 0 ? (
        <Card className="empty-state">
          <p>No requests assigned for viewing</p>
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
                      <Link
                        to={`/request/${req.purchase_request_id || req.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={16} />
                      </Link>
                      <Button size="sm" onClick={() => openDecisionModal(req)}>
                        Decide
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
        isOpen={isDecisionModalOpen}
        onClose={() => {
          if (!decisionLoading) {
            setIsDecisionModalOpen(false);
            setSelectedRequest(null);
          }
        }}
        title="Final Approval Decision"
      >
        {selectedRequest && (
          <div className="final-decision-modal">
            <div className="request-summary">
              <div>
                <strong>Request:</strong>{" "}
                {selectedRequest.request_id || selectedRequest.id}
              </div>
              <div>
                <strong>Faculty / Unit:</strong> {selectedRequest.department}
              </div>
            </div>

            <div className="decision-form-row">
              <label htmlFor="final-decision-select">Decision</label>
              <select
                id="final-decision-select"
                className="final-decision-select"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={decisionLoading}
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="CLARIFICATION_REQUESTED">
                  Request Clarification
                </option>
              </select>
            </div>

            <div className="decision-form-row">
              <label htmlFor="final-decision-comments">
                Comments to Requester
              </label>
              <textarea
                id="final-decision-comments"
                className="final-decision-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide reason or clarification details"
                disabled={decisionLoading}
              />
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={decisionLoading}
              >
                Cancel
              </Button>
              <Button onClick={submitDecision} disabled={decisionLoading}>
                {decisionLoading ? "Submitting..." : "Submit Decision"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
