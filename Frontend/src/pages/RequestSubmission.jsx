import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import "./RequestSubmission.css";

const createEmptyItem = () => ({
  item_type: "IT",
  item_name: "",
  item_description: "",
  technical_specifications: "",
  quantity: "",
  estimated_cost: "",
  funding_source: "",
  department: "",
  required_date: "",
});

export default function RequestSubmission({ user }) {
  const navigate = useNavigate();
  const today = new Date();
  const minRequiredDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [submissionPreview, setSubmissionPreview] = useState(null);
  const [formData, setFormData] = useState({
    items: [createEmptyItem()],
    justification: "",
  });

  const itemTypeOptions = [
    { label: "IT Equipment", value: "IT" },
    { label: "Non-IT Equipment", value: "NON_IT" },
  ];

  const fundingOptions = [
    { label: "MPP (Master Procurement Plan)", value: "MPP" },
    { label: "Self-fund", value: "SELF_FUND" },
    { label: "Special Fund", value: "SPECIAL_FUND" },
  ];

  const departmentOptions = [
    { label: "Faculty of Applied Sciences (FAS)", value: "FAS" },
    { label: "Faculty of Technology (FOT)", value: "FOT" },
    {
      label: "Faculty of Business Studies and Finance (FBSF)",
      value: "FBSF",
    },
    { label: "Faculty of Medicine (FOM)", value: "FOM" },
    {
      label: "Faculty of Agriculture and Plantation Management (FAPM)",
      value: "FAPM",
    },
    {
      label: "Faculty of Livestock, Fisheries and Nutrition (FLFN)",
      value: "FLFN",
    },
    { label: "English Unit", value: "ENGLISH_UNIT" },
    { label: "ICT Center", value: "ICT_CENTER" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      if (prev.items.length === 1) {
        return prev;
      }

      return {
        ...prev,
        items: prev.items.filter((_, idx) => idx !== index),
      };
    });
  };

  const openDatePicker = (e) => {
    if (typeof e.target.showPicker === "function") {
      e.target.showPicker();
    }
  };

  const blockManualDateInput = (e) => {
    if (e.key !== "Tab") {
      e.preventDefault();
    }
  };

  const totals = formData.items.reduce(
    (acc, item) => ({
      quantity: acc.quantity + (Number(item.quantity) || 0),
      estimatedCost: acc.estimatedCost + (Number(item.estimated_cost) || 0),
    }),
    { quantity: 0, estimatedCost: 0 },
  );

  const getOptionLabel = (options, value) => {
    return options.find((option) => option.value === value)?.label || value;
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `$${numericValue.toFixed(2)}` : "-";
  };

  const validateAndBuildSubmission = () => {
    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      setError("At least one item is required");
      return null;
    }

    const normalizedItems = formData.items.map((item) => ({
      item_type: item.item_type,
      item_name: item.item_name?.trim() || "",
      item_description: item.item_description?.trim() || "",
      technical_specifications: item.technical_specifications?.trim() || "",
      quantity: Number(item.quantity),
      estimated_cost: Number(item.estimated_cost),
      funding_source: item.funding_source,
      department: item.department,
      required_date: item.required_date,
    }));

    const invalidItemIndex = normalizedItems.findIndex(
      (item) =>
        !["IT", "NON_IT"].includes(item.item_type) ||
        !item.item_name ||
        !item.technical_specifications ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.estimated_cost) ||
        item.estimated_cost < 0 ||
        !item.funding_source ||
        !item.department ||
        !item.required_date,
    );

    if (invalidItemIndex !== -1) {
      setError(
        `Please complete all required fields for item #${invalidItemIndex + 1}`,
      );
      return null;
    }

    const invalidDateIndex = normalizedItems.findIndex(
      (item) => item.required_date < minRequiredDate,
    );

    if (invalidDateIndex !== -1) {
      setError(
        `Required date cannot be before today for item #${invalidDateIndex + 1}`,
      );
      return null;
    }

    const payload = {
      items: normalizedItems,
      justification: formData.justification,
    };

    const uniqueFundingSources = [
      ...new Set(
        normalizedItems.map((item) =>
          getOptionLabel(fundingOptions, item.funding_source),
        ),
      ),
    ];
    const uniqueDepartments = [
      ...new Set(
        normalizedItems.map((item) =>
          getOptionLabel(departmentOptions, item.department),
        ),
      ),
    ];
    const uniqueRequiredDates = [
      ...new Set(normalizedItems.map((item) => item.required_date)),
    ];

    const preview = {
      itemCount: normalizedItems.length,
      fundingSources: uniqueFundingSources,
      departments: uniqueDepartments,
      requiredDates: uniqueRequiredDates,
      justification: formData.justification?.trim() || "-",
      totalQuantity: normalizedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      totalEstimatedCost: normalizedItems.reduce(
        (sum, item) => sum + item.estimated_cost,
        0,
      ),
      items: normalizedItems,
    };

    return { payload, preview };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Form submission started");
    console.log("📋 Form data:", formData);

    const submission = validateAndBuildSubmission();
    if (!submission) {
      return;
    }

    setError("");
    setSuccess("");
    setPendingPayload(submission.payload);
    setSubmissionPreview(submission.preview);
    setIsConfirmOpen(true);
  };

  const confirmAndSubmit = async () => {
    if (!pendingPayload) {
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Sending request payload:", pendingPayload);

      const response = await api.post("/requests", pendingPayload);

      console.log("✅ Request created successfully:", response.data);

      const created = response.data;
      const isSplitResponse = Array.isArray(created?.requests);

      setSuccess(
        isSplitResponse
          ? `Multi-item request submitted successfully as ${created.requests.length} requests by item type.`
          : "Request submitted successfully!",
      );

      setTimeout(() => {
        if (isSplitResponse) {
          console.log(
            "🎯 Redirecting to dashboard after split request creation",
          );
          navigate("/dashboard");
          return;
        }

        console.log("🎯 Redirecting to request details:", created.id);
        navigate(`/request/${created.id}`);
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit request";
      console.error("❌ Request submission failed:", {
        message: errorMsg,
        status: err.response?.status,
        fullError: err.response?.data,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
      setPendingPayload(null);
      setSubmissionPreview(null);
    }
  };

  return (
    <div className="request-submission">
      <div className="page-header">
        <h1>Submit New Purchase Request</h1>
        <p>Fill in all required fields to submit your procurement request</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="section-header-row">
              <h2>Item Information</h2>
              <Button type="button" variant="secondary" onClick={addItem}>
                + Add Item
              </Button>
            </div>

            <div className="items-container">
              {formData.items.map((item, index) => (
                <Card key={`item-${index}`} className="item-card">
                  <div className="item-card-header">
                    <h3>Item #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="form-row">
                    <Select
                      label="Item Type *"
                      options={itemTypeOptions}
                      value={item.item_type}
                      onChange={(e) =>
                        handleItemChange(index, "item_type", e.target.value)
                      }
                      required
                    />
                    <Input
                      label="Item Name *"
                      type="text"
                      value={item.item_name}
                      onChange={(e) =>
                        handleItemChange(index, "item_name", e.target.value)
                      }
                      placeholder="e.g., Laptop"
                      required
                    />
                  </div>

                  <TextArea
                    label="Item Description"
                    value={item.item_description}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "item_description",
                        e.target.value,
                      )
                    }
                    placeholder="Detailed description"
                  />

                  <TextArea
                    label="Technical Specifications *"
                    value={item.technical_specifications}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "technical_specifications",
                        e.target.value,
                      )
                    }
                    placeholder="Technical specifications"
                    required
                  />

                  <div className="form-row">
                    <Input
                      label="Quantity *"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      required
                    />
                    <Input
                      label="Estimated Cost ($) *"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.estimated_cost}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "estimated_cost",
                          e.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-row">
                    <Select
                      label="Funding Source *"
                      options={fundingOptions}
                      value={item.funding_source}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "funding_source",
                          e.target.value,
                        )
                      }
                      required
                    />
                    <Select
                      label="Faculty / Unit *"
                      options={departmentOptions}
                      value={item.department}
                      onChange={(e) =>
                        handleItemChange(index, "department", e.target.value)
                      }
                      required
                    />
                  </div>

                  <Input
                    label="Required Date *"
                    type="date"
                    value={item.required_date}
                    onChange={(e) =>
                      handleItemChange(index, "required_date", e.target.value)
                    }
                    onFocus={openDatePicker}
                    onClick={openDatePicker}
                    onKeyDown={blockManualDateInput}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    min={minRequiredDate}
                    required
                  />
                </Card>
              ))}
            </div>

            <p className="items-summary">
              Total Quantity: <strong>{totals.quantity}</strong> | Total
              Estimated Cost:{" "}
              <strong>${totals.estimatedCost.toFixed(2)}</strong>
            </p>
          </div>

          <div className="form-section">
            <h2>Justification</h2>
            <TextArea
              label="Justification *"
              name="justification"
              value={formData.justification}
              onChange={handleChange}
              required
              placeholder="Explain why this purchase is necessary"
            />
          </div>

          <div className="form-section request-summary-section">
            <h2>Request Summary Preview</h2>

            <div className="summary-table-wrap">
              <table className="summary-table details-table">
                <tbody>
                  <tr>
                    <th>Funding Sources</th>
                    <td>
                      {formData.items.some((item) => item.funding_source)
                        ? [
                            ...new Set(
                              formData.items
                                .filter((item) => item.funding_source)
                                .map((item) =>
                                  getOptionLabel(
                                    fundingOptions,
                                    item.funding_source,
                                  ),
                                ),
                            ),
                          ].join(", ")
                        : "-"}
                    </td>
                    <th>Faculties / Units</th>
                    <td>
                      {formData.items.some((item) => item.department)
                        ? [
                            ...new Set(
                              formData.items
                                .filter((item) => item.department)
                                .map((item) =>
                                  getOptionLabel(
                                    departmentOptions,
                                    item.department,
                                  ),
                                ),
                            ),
                          ].join(", ")
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <th>Required Dates</th>
                    <td>
                      {formData.items.some((item) => item.required_date)
                        ? [
                            ...new Set(
                              formData.items
                                .filter((item) => item.required_date)
                                .map((item) => item.required_date),
                            ),
                          ].join(", ")
                        : "-"}
                    </td>
                    <th>Total Quantity</th>
                    <td>{totals.quantity}</td>
                  </tr>
                  <tr>
                    <th>Total Estimated Cost</th>
                    <td>{formatCurrency(totals.estimatedCost)}</td>
                    <th>Total Items</th>
                    <td>{formData.items.length}</td>
                  </tr>
                  <tr>
                    <th>Justification</th>
                    <td colSpan="3">{formData.justification?.trim() || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="summary-table-wrap">
              <table className="summary-table items-table-preview">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>Technical Specifications</th>
                    <th>Funding Source</th>
                    <th>Faculty / Unit</th>
                    <th>Required Date</th>
                    <th>Qty</th>
                    <th>Estimated Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={`summary-row-${index}`}>
                      <td>{index + 1}</td>
                      <td>{getOptionLabel(itemTypeOptions, item.item_type)}</td>
                      <td>{item.item_name?.trim() || "-"}</td>
                      <td>{item.item_description?.trim() || "-"}</td>
                      <td>{item.technical_specifications?.trim() || "-"}</td>
                      <td>
                        {item.funding_source
                          ? getOptionLabel(fundingOptions, item.funding_source)
                          : "-"}
                      </td>
                      <td>
                        {item.department
                          ? getOptionLabel(departmentOptions, item.department)
                          : "-"}
                      </td>
                      <td>{item.required_date || "-"}</td>
                      <td>{Number(item.quantity) > 0 ? item.quantity : "-"}</td>
                      <td>{formatCurrency(item.estimated_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!loading) {
            setIsConfirmOpen(false);
          }
        }}
        title="Confirm Request Submission"
      >
        <div className="submission-preview">
          <div className="confirmation-warning">
            After submission, this request cannot be changed. Please review the
            details carefully before proceeding.
          </div>

          {submissionPreview && (
            <>
              <div className="preview-grid">
                <div>
                  <strong>Total Items:</strong> {submissionPreview.itemCount}
                </div>
                <div>
                  <strong>Total Quantity:</strong>{" "}
                  {submissionPreview.totalQuantity}
                </div>
                <div>
                  <strong>Total Estimated Cost:</strong> $
                  {submissionPreview.totalEstimatedCost.toFixed(2)}
                </div>
                <div>
                  <strong>Funding Sources:</strong>{" "}
                  {submissionPreview.fundingSources.join(", ")}
                </div>
                <div>
                  <strong>Faculties / Units:</strong>{" "}
                  {submissionPreview.departments.join(", ")}
                </div>
                <div>
                  <strong>Required Dates:</strong>{" "}
                  {submissionPreview.requiredDates.join(", ")}
                </div>
              </div>

              <div className="preview-justification">
                <strong>Justification:</strong>
                <p>{submissionPreview.justification}</p>
              </div>

              <div className="preview-items-list">
                {submissionPreview.items.map((item, index) => (
                  <div
                    key={`preview-item-${index}`}
                    className="preview-item-row"
                  >
                    <strong>
                      Item #{index + 1} (
                      {getOptionLabel(itemTypeOptions, item.item_type)})
                    </strong>
                    <div>Name: {item.item_name}</div>
                    <div>
                      Funding Source:{" "}
                      {getOptionLabel(fundingOptions, item.funding_source)}
                    </div>
                    <div>
                      Faculty / Unit:{" "}
                      {getOptionLabel(departmentOptions, item.department)}
                    </div>
                    <div>Required Date: {item.required_date}</div>
                    <div>Quantity: {item.quantity}</div>
                    <div>Cost: ${item.estimated_cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="confirmation-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmAndSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Proceed and Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
