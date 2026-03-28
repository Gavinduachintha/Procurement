import { Outlet, useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import "./Layout.css";

export default function Layout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="layout">
      <Navigation user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
