import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Procurement System</h1>
          <p>Documentation & Notification Workflow</p>
        </div>
        <div className="topbar-right">
          {user && (
            <>
              <span className="pill">{user.full_name}</span>
              <span className="pill">{user.role}</span>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
