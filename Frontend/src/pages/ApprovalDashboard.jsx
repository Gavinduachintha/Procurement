import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import api from "../api/client";
import Card from "../components/Card";
import Alert from "../components/Alert";
import "./ApprovalDashboard.css";

export default function ApprovalDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div className="loading-state">Loading approvals...</div>;

  return (
    <div className="approval-dashboard">
      <div className="page-header">
        <h1>Approval Dashboard (View Only)</h1>
        <p>
          Receive notifications and view requests. No approval action required.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <Alert type="info">
        Manual approvals are disabled for DEAN / REGISTRAR / BURSAR /
        VICE_CHANCELLOR.
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
                <th>Action</th>
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
                    <Link
                      to={`/request/${req.purchase_request_id || req.id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
