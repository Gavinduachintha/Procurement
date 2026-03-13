import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { USER_ROLES } from "../../config/constants";
import { ApiClientError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { InputField } from "../../components/ui/Field";

const roles = Object.values(USER_ROLES);

export function AuthView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: USER_ROLES.REQUESTING_OFFICER as string,
    department: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Authentication failed";
      setError(message);
    }
  };

  return (
    <div className="auth-wrap">
      <Card title={mode === "login" ? "Login" : "Register"}>
        <form className="grid" onSubmit={onSubmit}>
          {mode === "register" && (
            <InputField
              label="Full Name"
              value={form.fullName}
              onChange={(e) =>
                setForm((s) => ({ ...s, fullName: e.target.value }))
              }
              required
            />
          )}

          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />

          <InputField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((s) => ({ ...s, password: e.target.value }))
            }
            required
          />

          {mode === "register" && (
            <>
              <label className="field">
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, role: e.target.value }))
                  }
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <InputField
                label="Department"
                value={form.department}
                onChange={(e) =>
                  setForm((s) => ({ ...s, department: e.target.value }))
                }
              />
            </>
          )}

          {error && <p className="error">{error}</p>}

          <div className="row">
            <Button type="submit">
              {mode === "login" ? "Login" : "Create Account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setMode((m) => (m === "login" ? "register" : "login"))
              }
            >
              {mode === "login"
                ? "Need an account? Register"
                : "Have an account? Login"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
