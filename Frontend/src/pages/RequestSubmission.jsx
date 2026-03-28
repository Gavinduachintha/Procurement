import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestApi } from "../api/endpoints";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./RequestSubmission.css";

export default function RequestSubmission({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    item_name: "",
    item_description: "",
    technical_specifications: "",
    quantity: "",
    estimated_cost: "",
    funding_source: "",
    justification: "",
    department: "",
    required_date: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await requestApi.submit({
        ...formData,
        quantity: parseInt(formData.quantity),
        estimated_cost: parseFloat(formData.estimated_cost),
      });

      setSuccess("Request submitted successfully!");
      setTimeout(() => {
        navigate(`/request/${response.data.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
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
            <h2>Item Information</h2>
            <Input
              label="Item Name *"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              required
              placeholder="e.g., Laptop"
            />
            <TextArea
              label="Item Description *"
              name="item_description"
              value={formData.item_description}
              onChange={handleChange}
              required
              placeholder="Detailed description of the item"
            />
            <TextArea
              label="Technical Specifications *"
              name="technical_specifications"
              value={formData.technical_specifications}
              onChange={handleChange}
              required
              placeholder="Detailed technical specifications"
            />
          </div>

          <div className="form-section">
            <h2>Request Details</h2>
            <div className="form-row">
              <Input
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
              />
              <Input
                label="Estimated Cost ($) *"
                name="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

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
