import { useEffect, useState } from "react";
import { approvalApi } from "../../api/approvalApi";
import { dashboardApi } from "../../api/dashboardApi";
import { useAuth } from "../../hooks/useAuth";
import type { PurchaseRequest } from "../../types/models";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function ApproverDashboard() {
  const { token } = useAuth();
  const [pending, setPending] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState<
    Array<{ decision: string; count: number }>
  >([]);

  const load = async () => {
    if (!token) return;
    const [pendingRows, statRows] = await Promise.all([
      approvalApi.pending(token),
      dashboardApi.approver(token),
    ]);
    setPending(pendingRows);
    setStats(statRows);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const decide = async (
    requestId: number,
    decision: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED",
  ) => {
    if (!token) return;
    await approvalApi.decide(token, requestId, { decision });
    await load();
  };

  return (
    <div className="dashboard-grid">
      <Card title="Approval Summary">
        <ul className="list">
          {stats.map((s) => (
            <li key={s.decision}>
              <strong>{s.decision}</strong>: {s.count}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Pending Approvals">
        <table className="table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Item</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id}>
                <td>{r.request_id}</td>
                <td>{r.item_name}</td>
                <td>{r.status}</td>
                <td>
                  <div className="row">
                    <Button onClick={() => void decide(r.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => void decide(r.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void decide(r.id, "CLARIFICATION_REQUESTED")
                      }
                    >
                      Clarification
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
