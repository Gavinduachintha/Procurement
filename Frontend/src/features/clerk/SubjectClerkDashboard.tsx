import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import { procurementApi } from "../../api/procurementApi";
import { useAuth } from "../../hooks/useAuth";
import type { Job, Supplier } from "../../types/models";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function SubjectClerkDashboard() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [category, setCategory] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [letterPreview, setLetterPreview] = useState("");

  const myJobs = useMemo(
    () => jobs.filter((j) => j.assigned_clerk_id === user?.id),
    [jobs, user?.id],
  );

  const load = async () => {
    if (!token) return;
    const allJobs = await dashboardApi.supplyBranch(token);
    setJobs(allJobs);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const selectCategory = async () => {
    if (!token || !jobId || !category) return;
    const data = await procurementApi.selectCategory(
      token,
      Number(jobId),
      category,
    );
    setSuppliers(data);
  };

  const applySuppliers = async () => {
    if (!token || !jobId || !selectedSupplierIds.length) return;
    await procurementApi.selectSuppliers(
      token,
      Number(jobId),
      selectedSupplierIds,
    );
    await load();
  };

  const generateLetters = async () => {
    if (!token || !jobId || !submissionDeadline) return;
    const data = await procurementApi.generateLetters(
      token,
      Number(jobId),
      submissionDeadline,
    );
    setLetterPreview(data.letterContent);
  };

  const viewSchedule = async () => {
    if (!token || !jobId) return;
    const data = await procurementApi.getSchedule(token, Number(jobId));
    setLetterPreview(
      `${data.jobNumber}\n${data.itemName}\n${data.rows
        .map(
          (r) =>
            `${r.supplierName}: ${r.quotationReceived ? "Received" : "Pending"}`,
        )
        .join("\n")}`,
    );
  };

  const toggleSupplier = (supplierId: number) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId],
    );
  };

  return (
    <div className="dashboard-grid">
      <Card title="My Assigned Jobs">
        <table className="table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Job Number</th>
              <th>Method</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            {myJobs.map((j) => (
              <tr key={j.id}>
                <td>{j.id}</td>
                <td>{j.job_number}</td>
                <td>{j.procurement_method}</td>
                <td>{j.item_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Supplier Selection & Quotation Letters">
        <label className="field">
          <span>Job ID</span>
          <input
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter assigned job id"
          />
        </label>
        <label className="field">
          <span>Supplier Category</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. IT Equipment"
          />
        </label>
        <Button onClick={() => void selectCategory()}>Load Suppliers</Button>

        <ul className="list">
          {suppliers.map((s) => (
            <li key={s.id}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedSupplierIds.includes(s.id)}
                  onChange={() => toggleSupplier(s.id)}
                />
                <span>
                  {s.name} ({s.email})
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="row">
          <Button onClick={() => void applySuppliers()}>
            Attach Suppliers
          </Button>
        </div>

        <label className="field">
          <span>Submission Deadline</span>
          <input
            type="date"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
          />
        </label>

        <div className="row">
          <Button onClick={() => void generateLetters()}>
            Generate Quotation Letters
          </Button>
          <Button variant="secondary" onClick={() => void viewSchedule()}>
            View Schedule
          </Button>
        </div>

        {letterPreview && <pre className="preview">{letterPreview}</pre>}
      </Card>
    </div>
  );
}
