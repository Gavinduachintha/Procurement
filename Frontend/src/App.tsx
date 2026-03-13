import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { AppShell } from "./layout/AppShell";
import { AuthView } from "./features/auth/AuthView";
import { RoleWorkspace } from "./features/common/RoleWorkspace";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return <AppShell>{user ? <RoleWorkspace /> : <AuthView />}</AppShell>;
}

export default App;
