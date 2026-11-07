import { Pencil, Trash2 } from "lucide-react";

function ComponentTable({
  components,
  loading,
  loadError,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="table-card" role="status" aria-live="polite">
        <p className="empty-copy">Loading inventory…</p>
      </div>
    );
  }

  if (loadError && components.length === 0) {
    return (
      <div className="table-card">
        <p className="empty-copy">
          Inventory could not be loaded. Check the error above and try Refresh.
        </p>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="table-card">
        <p className="empty-copy">
          No components match these filters. Add a part or clear search.
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Component inventory</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Category</th>
              <th scope="col">Manufacturer</th>
              <th scope="col">Qty</th>
              <th scope="col">Status</th>
              <th scope="col">Location</th>
              <th scope="col">Notes</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => {
              const isLowStock = Number(component.quantity) <= 2;

              return (
                <tr key={component._id}>
                  <td>
                    <strong>{component.name}</strong>
                    {isLowStock && (
                      <span className="low-badge">Low stock</span>
                    )}
                  </td>
                  <td>{component.category}</td>
                  <td>{component.manufacturer || "—"}</td>
                  <td>{component.quantity}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        component.status === "Available"
                          ? "status-available"
                          : "status-deployed"
                      }`}
                    >
                      {component.status}
                    </span>
                  </td>
                  <td>{component.location || "—"}</td>
                  <td className="notes-cell">{component.notes || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEdit(component)}
                        aria-label={`Edit ${component.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onDelete(component)}
                        aria-label={`Delete ${component.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComponentTable;
