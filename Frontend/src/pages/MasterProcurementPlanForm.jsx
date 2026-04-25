import { useMemo, useState } from "react";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { masterProcurementPlanApi } from "../api/endpoints";
import "./MasterProcurementPlanForm.css";

const PLAN_YEAR = 2026;

const DEPARTMENT_OPTIONS = [
  "Rehabilitation & Works",
  "Faculty of Applied Sciences",
  "Faculty of Agriculture & Plantation Management",
  "Faculty of Livestock Fisheries & Nutrition",
  "Faculty of Business Studies & Finance",
  "Faculty of Technology",
  "Faculty of Medicine",
  "Hostels",
  "Canteens",
  "Library",
  "Staff Development Centre",
  "Physical Education Unit",
  "ICT Centre / Kuliyapitiya",
  "ICT Centre / Makandura",
  "Administration Divisions",
  "Finance & Supplies Branch",
  "Medical Center",
  "Quality Assurance",
  "Entrepreneurship Skills Development (WUBIC)",
  "Leadership Development / CGU",
  "Strengthening Research (SRHDC)/Masters",
];

const PROCUREMENT_CATEGORY_OPTIONS = ["Works", "Goods", "Services", "Consultancy"];
const SOURCE_OF_FINANCING_OPTIONS = ["GOSL", "ADB", "World Bank", "Own Revenue", "Other Donor"];
const PROCUREMENT_METHOD_OPTIONS = [
  "ICB",
  "LIB",
  "LNB",
  "NCB",
  "NCB & National Shopping",
  "National Shopping",
  "Direct Contracting",
];
const LEVEL_OF_AUTHORITY_OPTIONS = ["HLPC", "SHLPC", "MPC", "DPC Minor", "DPC Major", "RPC"];
const PRIORITY_OPTIONS = [
  { label: "Priority (P)", value: "P" },
  { label: "Normal (N)", value: "N" },
  { label: "Urgent (U)", value: "U" },
];

const CURRENT_STATUS_OPTIONS = [
  "Planning for the year 2026",
  "Approval for Procurement Plan 2026",
  "Tender Documents Prepared",
  "Advertised",
  "Bids Evaluated",
  "Contract Awarded",
  "Implementation Ongoing",
  "Completed",
];

const createInitialFormData = () => ({
  department: "",
  subCategory: "",
  description: "",
  procurementCategory: "",
  estimatedCostMn: "",
  sourceOfFinancing: "GOSL",
  donorFinancierName: "",
  procurementMethod: "",
  levelOfAuthority: "",
  priorityStatus: "P",
  currentStatus: "",
  commencementYr1: true,
  commencementYr2: false,
  commencementYr3: false,
  completionYr1: true,
  completionYr2: false,
  completionYr3: false,
  contractPeriod: "",
  reference: "",
  remark: "",
});

const mapSelectOptions = (values) => values.map((value) => ({ label: value, value }));

export default function MasterProcurementPlanForm({ user }) {
  const [formData, setFormData] = useState(createInitialFormData());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const normalizedRole = String(user?.role || "")
    .trim()
    .toUpperCase();
  const canAccess = normalizedRole === "SUPPLY_BRANCH";

  const previewItemCode = useMemo(() => {
    const departmentRank = DEPARTMENT_OPTIONS.indexOf(formData.department) + 1;
    const categoryRank = PROCUREMENT_CATEGORY_OPTIONS.indexOf(formData.procurementCategory) + 1;
    const methodRank = PROCUREMENT_METHOD_OPTIONS.indexOf(formData.procurementMethod) + 1;

    if (departmentRank < 1 || categoryRank < 1 || methodRank < 1) {
      return "Auto-generated on save";
    }

    return `${departmentRank}.${categoryRank}.${methodRank}.x`;
  }, [formData.department, formData.procurementCategory, formData.procurementMethod]);

  if (!canAccess) {
    return (
      <div className="master-plan-page">
        <div className="page-header master-plan-header">
          <div>
            <h1>Master Procurement Plan Entry</h1>
            <p>Supply Branch Officer data entry form</p>
          </div>
          <span className="plan-year-badge">Plan Year: {PLAN_YEAR}</span>
        </div>
        <Alert type="error">
          Form access is allowed only for SUPPLY_BRANCH users. Current role: {normalizedRole || "UNKNOWN"}.
        </Alert>
      </div>
    );
  }

  const shouldShowDonorField = formData.sourceOfFinancing !== "GOSL";
  const donorRequired = formData.sourceOfFinancing === "Other Donor";

  const fieldClass = (name) => (errors[name] ? "field-invalid" : "");

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }

      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.department) {
      nextErrors.department = "Department / Faculty is required";
    }

    if (!formData.description || !formData.description.trim()) {
      nextErrors.description = "Description is required";
    }

    if (!formData.procurementCategory) {
      nextErrors.procurementCategory = "Procurement category is required";
    }

    const estimatedCost = Number(formData.estimatedCostMn);
    if (formData.estimatedCostMn === "" || !Number.isFinite(estimatedCost) || estimatedCost <= 0) {
      nextErrors.estimatedCostMn = "Estimated cost must be greater than zero";
    }

    if (!formData.sourceOfFinancing) {
      nextErrors.sourceOfFinancing = "Source of financing is required";
    }

    if (!formData.procurementMethod) {
      nextErrors.procurementMethod = "Procurement method is required";
    }

    if (!formData.levelOfAuthority) {
      nextErrors.levelOfAuthority = "Level of authority is required";
    }

    if (!formData.priorityStatus) {
      nextErrors.priorityStatus = "Priority status is required";
    }

    if (!formData.currentStatus) {
      nextErrors.currentStatus = "Current procurement preparedness status is required";
    }

    if (donorRequired && !formData.donorFinancierName.trim()) {
      nextErrors.donorFinancierName = "Donor/Financier name is required for Other Donor";
    }

    return nextErrors;
  };

  const buildPayload = (isDraft) => ({
    ...formData,
    donorFinancierName: shouldShowDonorField ? formData.donorFinancierName : "",
    isDraft,
  });

  const submitToApi = async (isDraft) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await masterProcurementPlanApi.create(buildPayload(isDraft));
      const saved = response.data?.data || response.data;
      const resultCode = saved?.item_code || saved?.itemCode || "(generated)";
      const resultStatus = saved?.record_status || saved?.recordStatus || (isDraft ? "DRAFT" : "SUBMITTED");

      setSuccess(`Saved successfully. Item Code: ${resultCode} | Status: ${resultStatus}`);
      setFormData(createInitialFormData());
      setErrors({});
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to save Master Procurement Plan entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError("Please fix the highlighted validation errors.");
      setSuccess("");
      return;
    }

    setErrors({});
    await submitToApi(false);
  };

  const handleSaveDraft = async () => {
    setErrors({});
    await submitToApi(true);
  };

  return (
    <div className="master-plan-page">
      <div className="page-header master-plan-header">
        <div>
          <h1>Master Procurement Plan Entry</h1>
          <p>Supply Branch Officer data entry form</p>
        </div>
        <span className="plan-year-badge">Plan Year: {PLAN_YEAR}</span>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit} className="master-plan-form" noValidate>
          <section className="form-section">
            <h2>Section 1 - Classification</h2>
            <div className="form-row">
              <Input
                label="S/N (Item Code)"
                value={previewItemCode}
                readOnly
                className="read-only-input"
                error={errors.itemCode}
              />
              <Select
                label="Department / Faculty"
                value={formData.department}
                onChange={(event) => updateField("department", event.target.value)}
                options={mapSelectOptions(DEPARTMENT_OPTIONS)}
                error={errors.department}
                className={fieldClass("department")}
              />
            </div>
            <Input
              label="Sub-category"
              placeholder="Capital Works, Rehabilitation"
              value={formData.subCategory}
              onChange={(event) => updateField("subCategory", event.target.value)}
            />
          </section>

          <section className="form-section">
            <h2>Section 2 - Item Details</h2>
            <TextArea
              label="Description"
              placeholder="Enter item description"
              rows={5}
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              error={errors.description}
              className={fieldClass("description")}
            />
            <div className="form-row">
              <Select
                label="Procurement Category"
                value={formData.procurementCategory}
                onChange={(event) => updateField("procurementCategory", event.target.value)}
                options={mapSelectOptions(PROCUREMENT_CATEGORY_OPTIONS)}
                error={errors.procurementCategory}
                className={fieldClass("procurementCategory")}
              />
              <div className="cost-field-wrap">
                <Input
                  label="Estimated Cost (Rs. LKR Mn.)"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.estimatedCostMn}
                  onChange={(event) => updateField("estimatedCostMn", event.target.value)}
                  error={errors.estimatedCostMn}
                  className={fieldClass("estimatedCostMn")}
                />
                <p className="field-helper">
                  Enter amount in millions (e.g. 2.395 = Rs. 2,395,000)
                </p>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Section 3 - Procurement Details</h2>
            <div className="form-row">
              <Select
                label="Source of Financing"
                value={formData.sourceOfFinancing}
                onChange={(event) => updateField("sourceOfFinancing", event.target.value)}
                options={mapSelectOptions(SOURCE_OF_FINANCING_OPTIONS)}
                error={errors.sourceOfFinancing}
                className={fieldClass("sourceOfFinancing")}
              />
              {shouldShowDonorField ? (
                <Input
                  label="Donor / Financier Name"
                  value={formData.donorFinancierName}
                  onChange={(event) => updateField("donorFinancierName", event.target.value)}
                  error={errors.donorFinancierName}
                  className={fieldClass("donorFinancierName")}
                />
              ) : (
                <Input
                  label="Donor / Financier Name"
                  value="Not required for GOSL"
                  readOnly
                  disabled
                  className="read-only-input"
                />
              )}
            </div>
            <div className="form-row">
              <Select
                label="Procurement Method"
                value={formData.procurementMethod}
                onChange={(event) => updateField("procurementMethod", event.target.value)}
                options={mapSelectOptions(PROCUREMENT_METHOD_OPTIONS)}
                error={errors.procurementMethod}
                className={fieldClass("procurementMethod")}
              />
              <Select
                label="Level of Authority"
                value={formData.levelOfAuthority}
                onChange={(event) => updateField("levelOfAuthority", event.target.value)}
                options={mapSelectOptions(LEVEL_OF_AUTHORITY_OPTIONS)}
                error={errors.levelOfAuthority}
                className={fieldClass("levelOfAuthority")}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Section 4 - Priority & Status</h2>
            <div className="radio-group-wrap">
              <label className="group-label">Priority Status</label>
              <div className={`radio-group ${errors.priorityStatus ? "group-invalid" : ""}`}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <label key={priority.value} className="radio-option">
                    <input
                      type="radio"
                      name="priorityStatus"
                      value={priority.value}
                      checked={formData.priorityStatus === priority.value}
                      onChange={(event) => updateField("priorityStatus", event.target.value)}
                    />
                    {priority.label}
                  </label>
                ))}
              </div>
              {errors.priorityStatus && <span className="group-error">{errors.priorityStatus}</span>}
            </div>

            <Select
              label="Current Procurement Preparedness Status"
              value={formData.currentStatus}
              onChange={(event) => updateField("currentStatus", event.target.value)}
              options={mapSelectOptions(CURRENT_STATUS_OPTIONS)}
              error={errors.currentStatus}
              className={fieldClass("currentStatus")}
            />
          </section>

          <section className="form-section">
            <h2>Section 5 - Schedule</h2>
            <div className="form-row">
              <div className="checkbox-group-wrap">
                <label className="group-label">Scheduled Commencement</label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.commencementYr1}
                      onChange={(event) => updateField("commencementYr1", event.target.checked)}
                    />
                    Yr 1 (2026)
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.commencementYr2}
                      onChange={(event) => updateField("commencementYr2", event.target.checked)}
                    />
                    Yr 2 (2027)
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.commencementYr3}
                      onChange={(event) => updateField("commencementYr3", event.target.checked)}
                    />
                    Yr 3 (2028)
                  </label>
                </div>
              </div>
              <div className="checkbox-group-wrap">
                <label className="group-label">Scheduled Completion</label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.completionYr1}
                      onChange={(event) => updateField("completionYr1", event.target.checked)}
                    />
                    Yr 1 (2026)
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.completionYr2}
                      onChange={(event) => updateField("completionYr2", event.target.checked)}
                    />
                    Yr 2 (2027)
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.completionYr3}
                      onChange={(event) => updateField("completionYr3", event.target.checked)}
                    />
                    Yr 3 (2028)
                  </label>
                </div>
              </div>
            </div>

            <Input
              label="Contract Period"
              placeholder="6 months, 1 year"
              value={formData.contractPeriod}
              onChange={(event) => updateField("contractPeriod", event.target.value)}
            />
          </section>

          <section className="form-section">
            <h2>Section 6 - Reference & Remarks</h2>
            <div className="form-row">
              <Input
                label="Reference (MTBF / Corporate Plan)"
                value={formData.reference}
                onChange={(event) => updateField("reference", event.target.value)}
              />
              <Input
                label="Remark"
                value={formData.remark}
                onChange={(event) => updateField("remark", event.target.value)}
              />
            </div>
          </section>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
