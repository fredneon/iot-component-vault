import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, CircuitBoard, Menu, Warehouse, X } from "lucide-react";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <CircuitBoard size={22} />
          </span>
          <div>
            <p className="brand-kicker">Lab inventory</p>
            <p className="brand-name">IoT Vault</p>
          </div>
        </div>

        <nav aria-label="Main">
          <NavLink
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
          >
            <Warehouse size={18} aria-hidden="true" />
            Inventory
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            to="/analytics"
            onClick={() => setSidebarOpen(false)}
          >
            <BarChart3 size={18} aria-hidden="true" />
            Analytics
          </NavLink>
        </nav>

        <p className="sidebar-note">
          Quantity is total units per record. Status is record-level
          (Available or Deployed). Low stock uses each item&apos;s minimum
          threshold (default 5).
        </p>
      </aside>

      <div className="main-pane">
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  );
}

export function MenuToggle({ sidebarOpen, setSidebarOpen }) {
  return (
    <button
      type="button"
      className="icon-btn menu-btn"
      onClick={() => setSidebarOpen((open) => !open)}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
    </button>
  );
}

export default AppLayout;
