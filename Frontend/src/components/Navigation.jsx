import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  Home,
  FileText,
  CheckCircle,
  ClipboardList,
  Briefcase,
  Users,
} from "lucide-react";
import { useState } from "react";
import "./Navigation.css";

export default function Navigation({ user, onLogout }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBasedLinks = () => {
    const links = [
      { to: "/dashboard", label: "Dashboard", icon: Home, show: true },
    ];

    console.log("🔗 Navigation.jsx: Building links for role:", user?.role);

    if (user?.role === "REQUESTING_OFFICER") {
      links.push({
        to: "/request/new",
        label: "Submit Request",
        icon: FileText,
        show: true,
      });
    }

    if (
      user?.role === "DIRECTOR_ICT" ||
      user?.role === "MAINTENANCE_ENGINEER"
    ) {
      links.push({
        to: "/specification-review",
        label: "Spec Review",
        icon: CheckCircle,
        show: true,
      });
    }

    if (["DEAN", "VICE_CHANCELLOR"].includes(user?.role)) {
      links.push({
        to: "/approvals",
        label: "Approvals",
        icon: ClipboardList,
        show: true,
      });
    }

    if (
      [
        "SUPPLY_BRANCH",
        "SUBJECT_CLERK",
        "MINOR_COMMITTEE",
        "MAJOR_COMMITTEE",
        "FINANCE_OFFICER",
      ].includes(user?.role)
    ) {
      links.push({
        to: "/supply-branch",
        label: "Procurement",
        icon: Briefcase,
        show: true,
      });
    }

    if (["REGISTRAR", "VICE_CHANCELLOR"].includes(user?.role)) {
      links.push({
        to: "/admin/users",
        label: "User Admin",
        icon: Users,
        show: true,
      });
    }

    console.log("✅ Navigation.jsx: Built", links.length, "navigation links");
    return links;
  };

  const links = getRoleBasedLinks();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <span className="logo-icon">🎓</span>
          Procurement System
        </Link>

        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          <Menu size={24} />
        </button>

        <div className={`nav-menu ${isOpen ? "open" : ""}`}>
          <div className="nav-links">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="nav-user">
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
