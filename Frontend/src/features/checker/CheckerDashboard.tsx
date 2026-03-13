import { useEffect, useState } from "react";
import { requestApi } from "../../api/requestApi";
import { specificationApi } from "../../api/specificationApi";
import { useAuth } from "../../hooks/useAuth";
import type { PurchaseRequest } from "../../types/models";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { TextAreaField } from "../../components/ui/Field";

export function CheckerDashboard() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [reviewedSpecifications, setReviewedSpecifications] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );

  const load = async () => {
    if (!token) return;
    const assigned = await requestApi.assignedForSpecification(token);
    setRequests(assigned);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const submitReview = async () => {
    if (!token || !selectedRequestId) return;
    await specificationApi.review(token, selectedRequestId, {
      reviewedSpecifications,
      reviewNotes,
    });
    setReviewedSpecifications("");
    setReviewNotes("");
    await load();
  };

  return (
    <div className="dashboard-grid">
      <Card title="Specification Review">
        <label className="field">
          <span>Select Request</span>
          <select
            value={selectedRequestId ?? ""}
            onChange={(e) => setSelectedRequestId(Number(e.target.value))}
          >
            <option value="">Select</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.request_id} - {r.item_name}
              </option>
            ))}
          </select>
        </label>

        <TextAreaField
          label="Reviewed Specifications"
          value={reviewedSpecifications}
          onChange={(e) => setReviewedSpecifications(e.target.value)}
        />
        <TextAreaField
          label="Review Notes"
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
        />
        <Button
          onClick={() => void submitReview()}
          disabled={!selectedRequestId || !reviewedSpecifications.trim()}
        >
          Return to Requester
        </Button>
      </Card>
    </div>
  );
}
