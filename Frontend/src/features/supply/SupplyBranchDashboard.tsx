import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import { procurementApi } from "../../api/procurementApi";
import { authApi } from "../../api/authApi";
import { requestApi } from "../../api/requestApi";
import { PROCUREMENT_METHODS, USER_ROLES } from "../../config/constants";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { Job, PurchaseRequest, User } from "../../types/models";

export function SupplyBranchDashboard() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string; email: string; category: string }>
  >([]);
  const [clerks, setClerks] = useState<User[]>([]);
  const [requestIdForStart, setRequestIdForStart] = useState("");
  const [method, setMethod] = useState("NCB");
  const [jobIdForAssign, setJobIdForAssign] = useState("");
  const [clerkId, setClerkId] = useState("");
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    category: "",
  });

  const approvedCount = useMemo(
    () => approvedRequests.length,
    [approvedRequests],
  );

  const load = async () => {
    if (!token) return;
    const [jobRows, clerkRows, approvedRows, supplierRows] = await Promise.all([
      dashboardApi.supplyBranch(token),
      authApi.usersByRole(token, USER_ROLES.SUBJECT_CLERK),
      requestApi.approvedWithoutJobs(token),
      procurementApi.listSuppliers(token),
    ]);
    setJobs(jobRows);
    setClerks(clerkRows);
    setApprovedRequests(approvedRows);
    setSuppliers(supplierRows);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const startJob = async () => {
    if (!token || !requestIdForStart) return;
    await procurementApi.startJob(token, Number(requestIdForStart), method);
    await load();
  };

  const assign = async () => {
    if (!token || !jobIdForAssign || !clerkId) return;
    await procurementApi.assignClerk(
      token,
      Number(jobIdForAssign),
      Number(clerkId),
    );
    await load();
  };

  const createSupplier = async () => {
    if (
      !token ||
      !supplierForm.name ||
      !supplierForm.email ||
      !supplierForm.category
    )
      return;
    await procurementApi.createSupplier(token, supplierForm);
    setSupplierForm({ name: "", email: "", category: "" });
    await load();
  };

  return (
    <div className="dashboard-grid">
      <Card title="Start Procurement Job">
        <label className="field">
          <span>Approved Request</span>
          <select
            value={requestIdForStart}
            onChange={(e) => setRequestIdForStart(e.target.value)}
          >
            <option value="">Select approved request</option>
            {approvedRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.request_id} - {r.item_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Procurement Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PROCUREMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => void startJob()}>Generate Job Number</Button>
        {!!approvedCount && (
          <p className="muted">Approved requests available: {approvedCount}</p>
        )}
      </Card>

      <Card title="Assign Subject Clerk">
        <label className="field">
          <span>Job ID</span>
          <input
            value={jobIdForAssign}
            onChange={(e) => setJobIdForAssign(e.target.value)}
            placeholder="Enter job id"
          />
        </label>
        <label className="field">
          <span>Clerk</span>
          <select value={clerkId} onChange={(e) => setClerkId(e.target.value)}>
            <option value="">Select clerk</option>
            {clerks.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.email})
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => void assign()}>Assign</Button>
      </Card>

      <Card title="Supplier Registry">
        <div className="grid">
          <label className="field">
            <span>Name</span>
            <input
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm((s) => ({ ...s, name: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={supplierForm.email}
              onChange={(e) =>
                setSupplierForm((s) => ({ ...s, email: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Category</span>
            <input
              value={supplierForm.category}
              onChange={(e) =>
                setSupplierForm((s) => ({ ...s, category: e.target.value }))
              }
            />
          </label>
          <Button onClick={() => void createSupplier()}>Add Supplier</Button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Supply Branch Jobs">
        <table className="table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Job Number</th>
              <th>Request</th>
              <th>Method</th>
              <th>Item</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.id}</td>
                <td>{j.job_number}</td>
                <td>{j.request_id}</td>
                <td>{j.procurement_method}</td>
                <td>{j.item_name}</td>
                <td>{j.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
