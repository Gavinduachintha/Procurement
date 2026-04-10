import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./RequestSubmission.css";

const createEmptyItem = () => ({
  item_type: "IT",
  item_name: "",
  item_description: "",
  technical_specifications: "",
  quantity: "",
  estimated_cost: "",
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
  const [formData, setFormData] = useState({
    items: [createEmptyItem()],
    funding_source: "",
    justification: "",
    department: "",
    required_date: "",
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
    { label: "ICT Center", value: "ICT_CENTER" },
    { label: "Maintenance", value: "MAINTENANCE" },
    { label: "Administration", value: "ADMINISTRATION" },
    { label: "Academic Affairs", value: "ACADEMIC_AFFAIRS" },
    { label: "Student Services", value: "STUDENT_SERVICES" },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Form submission started");
    console.log("📋 Form data:", formData);

    // Validate required fields
    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      setError("At least one item is required");
      return;
    }

    const normalizedItems = formData.items.map((item) => ({
      item_type: item.item_type,
      item_name: item.item_name?.trim() || "",
      item_description: item.item_description?.trim() || "",
      technical_specifications: item.technical_specifications?.trim() || "",
      quantity: Number(item.quantity),
      estimated_cost: Number(item.estimated_cost),
    }));

    const invalidItemIndex = normalizedItems.findIndex(
      (item) =>
        !["IT", "NON_IT"].includes(item.item_type) ||
        !item.item_name ||
        !item.technical_specifications ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.estimated_cost) ||
        item.estimated_cost < 0,
    );

    if (invalidItemIndex !== -1) {
      setError(
        `Please complete all required fields for item #${invalidItemIndex + 1}`,
      );
      return;
    }

    if (formData.required_date < minRequiredDate) {
      console.error(
        "❌ Validation failed: required_date cannot be in the past",
      );
      setError("Required date cannot be before today");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        items: normalizedItems,
        funding_source: formData.funding_source,
        justification: formData.justification,
        department: formData.department,
        required_date: formData.required_date,
      };

      console.log("📤 Sending request payload:", payload);

      const response = await api.post("/requests", payload);

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
            <h2>Request Details</h2>
            <div className="form-row">
              <Select
                label="Funding Source *"
                name="funding_source"
                options={fundingOptions}
                value={formData.funding_source}
                onChange={handleChange}
                required
              />
              <Select
                label="Department *"
                name="department"
                options={departmentOptions}
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Required Date *"
              name="required_date"
              type="date"
              value={formData.required_date}
              onChange={handleChange}
              onFocus={openDatePicker}
              onClick={openDatePicker}
              onKeyDown={blockManualDateInput}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              min={minRequiredDate}
              required
            />
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
    </div>
  );
}
