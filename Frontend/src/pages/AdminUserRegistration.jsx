import { useEffect, useState } from "react";
import { authApi } from "../api/endpoints";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./AdminUserRegistration.css";

const roleOptions = [
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

const departmentOptions = [
  "Computer Science",
  "ICT Center",
  "Maintenance",
  "Administration",
  "Finance",
  "Supply Branch",
  "Technical Evaluation Committee",
  "Procurement Committee",
  "General",
].map((department) => ({ value: department, label: department }));

const createInitialForm = () => ({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "REQUESTING_OFFICER",
  department: "",
});

const getUserDisplayName = (user) => user?.full_name || user?.name || "-";

export default function AdminUserRegistration() {
  const [formData, setFormData] = useState(createInitialForm());
  const [roleFilter, setRoleFilter] = useState("REQUESTING_OFFICER");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsersByRole = async (role) => {
    setLoadingUsers(true);
    setError("");

    try {
      const response = await authApi.listUsersByRole(role);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to load users for selected role.";
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsersByRole(roleFilter);
  }, [roleFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      return "Full name is required";
    }

    if (!formData.email.trim()) {
      return "Email is required";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    if (!formData.department) {
      return "Department is required";
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

    setSubmitting(true);

    try {
      await authApi.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department,
      });

      setSuccess("User account created successfully.");
      setFormData((prev) => ({
        ...createInitialForm(),
        role: prev.role,
        department: prev.department,
      }));

      await loadUsersByRole(roleFilter);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to create user account.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-user-page">
      <div className="page-header">
        <h1>Admin User Registration</h1>
        <p>Create user accounts and verify users by role.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="admin-user-layout">
        <Card className="admin-register-card">
          <h2>Create User Account</h2>

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
              placeholder="name@univ.edu"
            />

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={departmentOptions}
              required
            />

            <Input
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
            />

            <Input
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />

            <Button type="submit" disabled={submitting} className="full-width">
              {submitting ? "Creating Account..." : "Create User"}
            </Button>
          </form>
        </Card>

        <Card className="admin-users-card">
          <div className="users-card-header">
            <h2>Users By Role</h2>
            <div className="role-filter">
              <Select
                label="Role Filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                options={roleOptions}
              />
            </div>
          </div>

          {loadingUsers ? (
            <p className="users-loading">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="users-empty">No users found for selected role.</p>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{getUserDisplayName(user)}</td>
                      <td>{user.email}</td>
                      <td>{user.department || "-"}</td>
                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
