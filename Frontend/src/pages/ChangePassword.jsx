import { useState } from "react";
import { authApi } from "../api/endpoints";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./ChangePassword.css";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePassword({ user }) {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!formData.currentPassword) {
      return "Current password is required";
    }

    if (formData.newPassword.length < 6) {
      return "New password must be at least 6 characters";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return "New password and confirm password do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      return "New password must be different from current password";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(response.data?.message || "Password changed successfully");
      setFormData(initialForm);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to change password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>
          Signed in as {user?.email || "-"} ({user?.role || "-"})
        </p>
      </div>

      <Card className="change-password-card">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleSubmit} className="change-password-form">
          <Input
            type="password"
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            placeholder="Enter current password"
          />

          <Input
            type="password"
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            placeholder="At least 6 characters"
          />

          <Input
            type="password"
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Re-enter new password"
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
