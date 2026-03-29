import { Outlet, useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import "./Layout.css";

export default function Layout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("🚪 Layout.jsx: Logout initiated for user:", user.id);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("✅ Layout.jsx: Session cleared from localStorage");
    setUser(null);
    console.log("🎯 Layout.jsx: Navigating to login page");
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
