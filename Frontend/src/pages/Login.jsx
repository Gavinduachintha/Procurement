import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "./Auth.css";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔐 Login attempt with email:", email);

    setError("");
    setLoading(true);

    try {
      console.log("📝 Sending login request...");
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      console.log(
        "✅ Login successful for user:",
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
        err.response?.data?.message || "Login failed. Please try again.";
      console.error("❌ Login failed:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎓 Procurement System</h1>
          <p>University Purchase Management</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" disabled={loading} className="full-width">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
