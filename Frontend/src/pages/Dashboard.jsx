import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Users } from "lucide-react";
import api from "../api/client";
import Card from "../components/Card";
import Alert from "../components/Alert";
import "./Dashboard.css";

export default function Dashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("📊 Dashboard component mounted. User role:", user?.role);
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      let endpoint = "/requests/mine";

      // Use role-specific endpoints for requests
      if (user?.role === "REQUESTING_OFFICER") {
        endpoint = "/requests/mine";
      } else if (["DEAN", "VICE_CHANCELLOR"].includes(user?.role)) {
        endpoint = "/approvals/mine/all";
      } else if (
        ["DIRECTOR_ICT", "MAINTENANCE_ENGINEER"].includes(user?.role)
      ) {
        endpoint = "/requests/assigned/specification/all";
      } else if (
        [
          "SUPPLY_BRANCH",
          "SUBJECT_CLERK",
          "TEC_MEMBER",
          "MINOR_COMMITTEE",
          "MAJOR_COMMITTEE",
          "FINANCE_OFFICER",
        ].includes(user?.role)
      ) {
        endpoint = "/dashboard/supply-branch"; // Procurement jobs
      }

      console.log(
        "🔄 Fetching requests from endpoint:",
        endpoint,
        "for user role:",
        user?.role,
      );

      const response = await api.get(endpoint);
      console.log("📦 Raw API response:", response.data);

      let data = response.data.data || response.data;

      console.log(
        "📋 Extracted data:",
        data,
        "Type:",
        typeof data,
        "Is Array:",
        Array.isArray(data),
      );

      // Handle different response structures
      if (Array.isArray(data)) {
        console.log("✅ Data is array, setting", data.length, "items");
        setRequests(data);
      } else if (data && data.requests) {
        console.log(
          "✅ Data has .requests property with",
          data.requests.length,
          "items",
        );
        setRequests(data.requests);
      } else if (data && data.items) {
        console.log(
          "✅ Data has .items property with",
          data.items.length,
          "items",
        );
        setRequests(data.items);
      } else if (typeof data === "object" && !Array.isArray(data)) {
        // If it's a single object, wrap it in an array
        const values = Object.values(data).filter(
          (item) => item && typeof item === "object",
        );
        console.log("⚠️ Data is object, extracted", values.length, "values");
        setRequests(values);
      } else {
        console.log(
          "✅ Setting data as-is:",
          Array.isArray(data) ? data.length + " items" : "empty",
        );
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("❌ Error loading dashboard:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      SUBMITTED: "badge-info",
      SPEC_CHECKING: "badge-warning",
      SPEC_CHECKED: "badge-info",
      SPEC_REWORK_REQUESTED: "badge-warning",
      APPROVAL_PENDING: "badge-warning",
      PENDING: "badge-warning",
      APPROVED: "badge-success",
      REJECTED: "badge-danger",
      CLARIFICATION_REQUESTED: "badge-warning",
      IN_PROCUREMENT: "badge-info",
      COMPLETED: "badge-success",
      JOB_CREATED: "badge-info",
      CLERK_ASSIGNED: "badge-info",
      CATEGORY_SELECTED: "badge-warning",
      PENDING_TEC_DECISION: "badge-warning",
      TEC_DECISION_ENTERED: "badge-info",
      PENDING_MINOR_COMMITTEE_APPROVAL: "badge-warning",
      PENDING_MAJOR_COMMITTEE_APPROVAL: "badge-warning",
      COMMITTEE_APPROVED: "badge-success",
      COMMITTEE_REJECTED: "badge-danger",
      COMMITTEE_CLARIFICATION_REQUESTED: "badge-warning",
      COMMITTEE_AMENDMENT_REQUESTED: "badge-warning",
      PURCHASE_ORDER_GENERATED: "badge-info",
      DELIVERED: "badge-info",
      ACCEPTED: "badge-success",
      PAYMENT_VOUCHER_GENERATED: "badge-success",
    };
    return statuses[status] || "badge-info";
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="dashboard-actions">
          {user?.role === "REQUESTING_OFFICER" && (
            <Link to="/request/new" className="btn btn-primary">
              <Plus size={18} />
              New Request
            </Link>
          )}
          {String(user?.role || "").trim().toUpperCase() === "SUPPLY_BRANCH" && (
            <Link to="/master-procurement-plan/new" className="btn btn-success">
              <Plus size={18} />
              Open Master Plan Form
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin/users" className="btn btn-primary">
              <Users size={18} />
              Open User Admin
            </Link>
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="empty-state">
          <p>No requests found</p>
          {user?.role === "REQUESTING_OFFICER" && (
            <Link to="/request/new" className="btn btn-primary mt-2">
              Create Your First Request
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin/users" className="btn btn-primary mt-2">
              Open User Administration
            </Link>
          )}
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.request_id || req.id}</strong>
                  </td>
                  <td>{req.item_name || req.request_id || "-"}</td>
                  <td>{req.department || "-"}</td>
                  <td>
                    <span
                      className={`badge ${getStatusBadge(
                        req.approval_decision || req.status,
                      )}`}
                    >
                      {req.approval_decision ||
                        req.status ||
                        req.request_status ||
                        "-"}
                    </span>
                  </td>
                  <td>${req.estimated_cost || req.total_amount || "0.00"}</td>
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
