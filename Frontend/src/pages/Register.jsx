import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./Auth.css";

export default function Register({ setUser }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "REQUESTING_OFFICER",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: "REQUESTING_OFFICER", label: "Requesting Officer" },
    { value: "DIRECTOR_ICT", label: "Director ICT" },
    { value: "MAINTENANCE_ENGINEER", label: "Maintenance Engineer" },
    { value: "SPECIFICATION_CHECKER", label: "Specification Checker" },
    { value: "DEAN", label: "Dean" },
    { value: "REGISTRAR", label: "Registrar" },
    { value: "BURSAR", label: "Bursar" },
    { value: "VICE_CHANCELLOR", label: "Vice Chancellor" },
    { value: "SUPPLY_BRANCH", label: "Supply Branch" },
    { value: "SUBJECT_CLERK", label: "Subject Clerk" },
    { value: "TEC_MEMBER", label: "TEC Member" },
    { value: "MINOR_COMMITTEE", label: "Minor Committee" },
    { value: "MAJOR_COMMITTEE", label: "Major Committee" },
    { value: "FINANCE_OFFICER", label: "Finance Officer" },
  ];

  const departments = [
    "Computer Science",
    "ICT Center",
    "Maintenance",
    "Administration",
    "Finance",
    "Supply Branch",
    "Technical Evaluation Committee",
    "Procurement Committee",
    "General",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Register attempt with email:", formData.email);

    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.department.trim()) {
      setError("Department is required");
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Sending registration request...");
      const response = await api.post("/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
      });

      const { token, user } = response.data;

      console.log(
        "✅ Registration successful for user:",
        user.id,
        "with role:",
        user.role,
      );

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("💾 Stored token and user in localStorage");

      setUser(user);
      console.log("🎯 Navigating to dashboard...");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Registration failed. Please try again.";
      console.error("❌ Registration failed:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div className="auth-header">
          <h1>🎓 Procurement System</h1>
          <p>Create New Account</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />

          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roles}
          />

          <Select
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            options={departments.map((dept) => ({
              value: dept,
              label: dept,
            }))}
            required
          />

          <Input
            type="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />

          <Input
            type="password"
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />

          <Button type="submit" disabled={loading} className="full-width">
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <div className="auth-footer" style={{ textAlign: "center" }}>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
