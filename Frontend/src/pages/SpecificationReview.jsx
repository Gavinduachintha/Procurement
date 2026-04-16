import { useState, useEffect } from "react";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import "./SpecificationReview.css";

export default function SpecificationReview({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [itemDecisions, setItemDecisions] = useState([]);

  useEffect(() => {
    console.log(
      "🔍 SpecificationReview component mounted. User role:",
      user?.role,
    );
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await api.get("/requests/assigned/specification/all");
      const data = response.data.data || response.data;

      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && data.requests) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to load specification reviews";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getReviewItems = () => {
    if (!selectedRequest) return [];

    if (
      Array.isArray(selectedRequest.items) &&
      selectedRequest.items.length > 0
    ) {
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

  const openReviewModal = async (request) => {
    setError("");
    setSuccess("");
    setIsModalOpen(true);
    setDetailsLoading(true);

    try {
      const response = await api.get(`/requests/${request.id}`);
      const fullRequest = response.data.data || response.data;
      setSelectedRequest(fullRequest);

      const rows =
        Array.isArray(fullRequest.items) && fullRequest.items.length > 0
          ? fullRequest.items
          : [
              {
                line_no: 1,
                item_type: fullRequest.item_type,
                item_name: fullRequest.item_name,
                item_description: fullRequest.item_description,
                technical_specifications: fullRequest.technical_specifications,
                quantity: fullRequest.quantity,
                estimated_cost: fullRequest.estimated_cost,
                funding_source: fullRequest.funding_source,
                department: fullRequest.department,
                required_date: fullRequest.required_date,
              },
            ];

      setItemDecisions(
        rows.map((item, index) => ({
          lineNo: Number(item.line_no || index + 1),
          decision: "APPROVED",
          message: "",
        })),
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to load request details";
      setError(errorMsg);
      setIsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateItemDecision = (lineNo, key, value) => {
    setItemDecisions((prev) =>
      prev.map((row) =>
        row.lineNo === lineNo ? { ...row, [key]: value } : row,
      ),
    );
  };

  const submitReview = async () => {
    if (!selectedRequest) return;

    const missingMessage = itemDecisions.find(
      (row) => !String(row.message || "").trim(),
    );

    if (missingMessage) {
      setError(`Message is required for item #${missingMessage.lineNo}`);
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/specifications/${selectedRequest.id}/review`, {
        itemDecisions: itemDecisions.map((row) => ({
          lineNo: row.lineNo,
          decision: row.decision,
          message: row.message.trim(),
        })),
      });

      setSuccess("Item-level specification decisions submitted successfully.");
      setIsModalOpen(false);
      setSelectedRequest(null);
      setItemDecisions([]);
      await loadReviews();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit specification review";
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading reviews...</div>;

  const pendingStatuses = new Set([
    "SPEC_REVIEW_PENDING",
    "SPEC_REWORK_REQUESTED",
  ]);
  const pendingRequests = requests.filter((row) =>
    pendingStatuses.has(row.status),
  );
  const historyRequests = requests.filter(
    (row) => !pendingStatuses.has(row.status),
  );

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  return (
    <div className="spec-review">
      <div className="page-header">
        <h1>Specification Review</h1>
        <p>
          DIRECTOR_ICT / MAINTENANCE_ENGINEER can approve, deny, or request
          modification per item.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {requests.length === 0 ? (
        <Card className="empty-state">
          <p>No specifications to review</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3>Pending Work</h3>
            {pendingRequests.length === 0 ? (
              <p>No pending specification reviews.</p>
            ) : (
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
                  {pendingRequests.map((req) => (
                    <tr key={`${req.id}-pending`}>
                      <td>{req.request_id}</td>
                      <td>{req.item_name}</td>
                      <td>{req.department}</td>
                      <td>{req.requested_by_name}</td>
                      <td>
                        <Button size="sm" onClick={() => openReviewModal(req)}>
                          Review Items
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h3>Previous Work</h3>
            {historyRequests.length === 0 ? (
              <p>No previous specification reviews yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Item</th>
                    <th>Department</th>
                    <th>Submitted By</th>
                    <th>Current Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRequests.map((req) => (
                    <tr key={`${req.id}-history`}>
                      <td>{req.request_id}</td>
                      <td>{req.item_name}</td>
                      <td>{req.department}</td>
                      <td>{req.requested_by_name}</td>
                      <td>{req.status}</td>
                      <td>{formatDateTime(req.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsModalOpen(false);
            setSelectedRequest(null);
            setItemDecisions([]);
          }
        }}
        title="Item-level Specification Decision"
      >
        {detailsLoading ? (
          <div className="loading-state">Loading request details...</div>
        ) : (
          selectedRequest && (
            <div className="review-modal">
              <div className="spec-info">
                <div>
                  <strong>Request ID:</strong>{" "}
                  {selectedRequest.request_id || selectedRequest.id}
                </div>
                <div>
                  <strong>Status:</strong> {selectedRequest.status}
                </div>
              </div>

              <div className="review-items-table-wrap">
                <table className="review-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Cost</th>
                      <th>Decision</th>
                      <th>Message to Requester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReviewItems().map((item, index) => {
                      const lineNo = Number(item.line_no || index + 1);
                      const rowState = itemDecisions.find(
                        (row) => row.lineNo === lineNo,
                      ) || {
                        lineNo,
                        decision: "APPROVED",
                        message: "",
                      };

                      return (
                        <tr key={`spec-review-item-${lineNo}`}>
                          <td>{lineNo}</td>
                          <td>{item.item_type || "-"}</td>
                          <td>{item.item_name || "-"}</td>
                          <td>{item.quantity ?? "-"}</td>
                          <td>
                            ${Number(item.estimated_cost || 0).toFixed(2)}
                          </td>
                          <td>
                            <select
                              className="item-decision-select"
                              value={rowState.decision}
                              onChange={(e) =>
                                updateItemDecision(
                                  lineNo,
                                  "decision",
                                  e.target.value,
                                )
                              }
                              disabled={actionLoading}
                            >
                              <option value="APPROVED">Approve</option>
                              <option value="REJECTED">Deny</option>
                              <option value="REQUEST_MODIFICATION">
                                Request Modification
                              </option>
                            </select>
                          </td>
                          <td>
                            <textarea
                              className="item-message-input"
                              value={rowState.message}
                              onChange={(e) =>
                                updateItemDecision(
                                  lineNo,
                                  "message",
                                  e.target.value,
                                )
                              }
                              placeholder="Write message for requester"
                              disabled={actionLoading}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                    setItemDecisions([]);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button onClick={submitReview} disabled={actionLoading}>
                  {actionLoading ? "Submitting..." : "Submit Item Decisions"}
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
