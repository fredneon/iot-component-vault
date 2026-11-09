import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Pencil, Trash2 } from "lucide-react";
import { displayProtocol } from "../constants/hardware.js";

function specValue(value) {
  return value === 0 || value ? value : "Not specified";
}

function HardwareSpecs({ component }) {
  const protocols = Array.isArray(component.communicationProtocols)
    ? component.communicationProtocols
    : [];

  return (
    <section className="hardware-specs" aria-label="Hardware specifications">
      <h3>Hardware specifications</h3>
      <dl>
        <div>
          <dt>Architecture</dt>
          <dd>{specValue(component.architecture)}</dd>
        </div>
        <div>
          <dt>Operating voltage</dt>
          <dd>
            {component.operatingVoltage === 0 || component.operatingVoltage
              ? `${component.operatingVoltage} V`
              : "Not specified"}
          </dd>
        </div>
        <div>
          <dt>Communication protocols</dt>
          <dd>
            {protocols.length > 0 ? (
              <span className="protocol-badges">
                {protocols.map((protocol) => (
                  <span key={protocol} className="protocol-badge">
                    {displayProtocol(protocol)}
                  </span>
                ))}
              </span>
            ) : (
              "Not specified"
            )}
          </dd>
        </div>
        <div>
          <dt>Datasheet</dt>
          <dd>
            {component.datasheetUrl ? (
              <a
                className="datasheet-link"
                href={component.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={14} aria-hidden="true" />
                Open datasheet
              </a>
            ) : (
              "Not specified"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ComponentTable({
  components,
  loading,
  loadError,
  onEdit,
  onDelete,
}) {
  const [expandedId, setExpandedId] = useState("");

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
              const isExpanded = expandedId === component._id;

              return (
                <FragmentRow
                  key={component._id}
                  component={component}
                  isLowStock={isLowStock}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? "" : component._id)
                  }
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  component,
  isLowStock,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <tr>
        <td>
          <div className="name-cell">
            <button
              type="button"
              className="icon-btn"
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Hide" : "Show"} hardware specifications for ${component.name}`}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <span>
              <strong>{component.name}</strong>
              {isLowStock && <span className="low-badge">Low stock</span>}
            </span>
          </div>
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
      {isExpanded && (
        <tr className="specs-row">
          <td colSpan={8}>
            <HardwareSpecs component={component} />
          </td>
        </tr>
      )}
    </>
  );
}

export default ComponentTable;
