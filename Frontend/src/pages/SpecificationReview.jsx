import { useState, useEffect } from "react";
import { specificationApi } from "../api/endpoints";
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

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await specificationApi.listReviews({
        status: "SPEC_CHECKING",
      });
      setRequests(response.data);
    } catch (err) {
      setError("Failed to load specification reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (request) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setIsModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await specificationApi.review(selectedRequest.id, {
        notes: reviewNotes,
      });
      setIsModalOpen(false);
      loadReviews();
      setSelectedRequest(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
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
        <Card>
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
                  <td>{req.id}</td>
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
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Review Specifications"
      >
        {selectedRequest && (
          <div className="review-modal">
            <div className="spec-info">
              <div>
                <strong>Item:</strong> {selectedRequest.item_name}
              </div>
              <div>
                <strong>Description:</strong>
                <p>{selectedRequest.item_description}</p>
              </div>
              <div>
                <strong>Specifications:</strong>
                <p>{selectedRequest.technical_specifications}</p>
              </div>
              <div>
                <strong>Quantity:</strong> {selectedRequest.quantity}
              </div>
              <div>
                <strong>Estimated Cost:</strong> $
                {selectedRequest.estimated_cost}
              </div>
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
        )}
      </Modal>
    </div>
  );
}
