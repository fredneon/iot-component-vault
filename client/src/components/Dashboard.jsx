import { useEffect, useMemo, useState } from "react";
import {
  CircuitBoard,
  Menu,
  Plus,
  RefreshCw,
  Warehouse,
  X,
} from "lucide-react";
import {
  createComponent,
  deleteComponent,
  getApiErrorMessage,
  getComponents,
  updateComponent,
} from "../api/client.js";
import StatsCards from "./StatsCards.jsx";
import SearchFilters from "./SearchFilters.jsx";
import ComponentTable from "./ComponentTable.jsx";
import ComponentForm from "./ComponentForm.jsx";
import QrModal from "./QrModal.jsx";

function Dashboard() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [protocol, setProtocol] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrComponent, setQrComponent] = useState(null);

  const loadComponents = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getComponents();
      setComponents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not load components. Try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setQrComponent(null);
        setFormOpen(false);
        setPendingDelete(null);
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const stats = useMemo(() => {
    return components.reduce(
      (totals, item) => {
        const quantity = Number(item.quantity) || 0;
        totals.totalUnits += quantity;

        if (item.status === "Available") {
          totals.availableUnits += quantity;
        }

        if (item.status === "Deployed") {
          totals.deployedUnits += quantity;
        }

        if (quantity <= 2) {
          totals.lowStockTypes += 1;
        }

        return totals;
      },
      {
        totalUnits: 0,
        availableUnits: 0,
        deployedUnits: 0,
        lowStockTypes: 0,
      }
    );
  }, [components]);

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return components.filter((item) => {
      const matchesCategory = !category || item.category === category;
      const matchesStatus = !status || item.status === status;
      const protocols = Array.isArray(item.communicationProtocols)
        ? item.communicationProtocols
        : [];
      const matchesProtocol = !protocol || protocols.includes(protocol);
      const searchText = [
        item.name,
        item.manufacturer,
        item.location,
        item.notes,
        item.category,
        item.architecture,
        protocols.join(" "),
        protocols.includes("I2C") ? "i²c i2c" : "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchText.includes(query);

      return matchesCategory && matchesStatus && matchesProtocol && matchesSearch;
    });
  }, [components, search, category, status, protocol]);

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (component) => {
    setEditing(component);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
  };

  const handleSave = async (payload) => {
    setSubmitting(true);
    setFormError("");

    try {
      if (editing) {
        const updated = await updateComponent(editing._id, payload);
        setComponents((current) =>
          current.map((item) =>
            String(item._id) === String(updated._id) ? updated : item
          )
        );
      } else {
        const created = await createComponent(payload);
        setComponents((current) => [created, ...current]);
      }

      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save the component."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteComponent(pendingDelete._id);
      setComponents((current) =>
        current.filter((item) => String(item._id) !== String(pendingDelete._id))
      );
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(err, "Could not delete the component.")
      );
    } finally {
      setDeleting(false);
    }
  };

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
          <a className="nav-link active" href="#inventory">
            <Warehouse size={18} aria-hidden="true" />
            Inventory
          </a>
        </nav>

        <p className="sidebar-note">
          Track boards, sensors, and kits. Low stock is quantity 2 or fewer.
        </p>
      </aside>

      <div className="main-pane">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <h1>Component Vault</h1>
            <p className="subtitle">Electronics lab stock, live from MongoDB.</p>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={loadComponents}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button type="button" className="btn primary" onClick={openCreate}>
              <Plus size={16} />
              Add component
            </button>
          </div>
        </header>

        <main id="inventory" className="content">
          {error && (
            <div className="banner error" role="alert">
              {error}
            </div>
          )}

          <StatsCards
            totalUnits={stats.totalUnits}
            availableUnits={stats.availableUnits}
            deployedUnits={stats.deployedUnits}
            lowStockTypes={stats.lowStockTypes}
          />

          <SearchFilters
            search={search}
            category={category}
            status={status}
            protocol={protocol}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
            onProtocolChange={setProtocol}
          />

          <ComponentTable
            components={filteredComponents}
            loading={loading}
            loadError={error}
            onEdit={openEdit}
            onDelete={(component) => {
              setDeleteError("");
              setPendingDelete(component);
            }}
            onShowQr={setQrComponent}
          />
        </main>
      </div>

      <ComponentForm
        open={formOpen}
        component={editing}
        submitting={submitting}
        serverError={formError}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      <QrModal component={qrComponent} onClose={() => setQrComponent(null)} />

      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div
            className="modal confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-title">Delete this component?</h2>
            <p>
              <strong>{pendingDelete.name}</strong> will be removed from the
              vault. This cannot be undone.
            </p>
            {deleteError && (
              <p className="banner error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
