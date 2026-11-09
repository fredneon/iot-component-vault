import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  ARCHITECTURE_SUGGESTIONS,
  PROTOCOLS,
  displayProtocol,
} from "../constants/hardware.js";

const CATEGORIES = ["Microcontroller", "Sensor", "Development Kit", "Other"];
const STATUSES = ["Available", "Deployed"];

const emptyForm = {
  name: "",
  category: "Microcontroller",
  manufacturer: "",
  quantity: 0,
  minimumStock: 5,
  status: "Available",
  location: "",
  notes: "",
  architecture: "",
  operatingVoltage: "",
  communicationProtocols: [],
  datasheetUrl: "",
};

function ComponentForm({
  open,
  component,
  submitting,
  serverError,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (component) {
      setForm({
        name: component.name || "",
        category: component.category || "Microcontroller",
        manufacturer: component.manufacturer || "",
        quantity: Number(component.quantity) || 0,
        minimumStock:
          component.minimumStock === 0 || component.minimumStock
            ? Number(component.minimumStock)
            : 5,
        status: component.status || "Available",
        location: component.location || "",
        notes: component.notes || "",
        architecture: component.architecture || "",
        operatingVoltage:
          component.operatingVoltage === 0 || component.operatingVoltage
            ? String(component.operatingVoltage)
            : "",
        communicationProtocols: Array.isArray(component.communicationProtocols)
          ? component.communicationProtocols
          : [],
        datasheetUrl: component.datasheetUrl || "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [open, component]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const toggleProtocol = (protocol) => {
    setForm((current) => {
      const selected = current.communicationProtocols.includes(protocol)
        ? current.communicationProtocols.filter((item) => item !== protocol)
        : [...current.communicationProtocols, protocol];

      return { ...current, communicationProtocols: selected };
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!CATEGORIES.includes(form.category)) {
      nextErrors.category = "Choose a valid category.";
    }

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      nextErrors.quantity = "Quantity must be a whole number of 0 or more.";
    }

    const minimumStock = Number(form.minimumStock);
    if (!Number.isInteger(minimumStock) || minimumStock < 0) {
      nextErrors.minimumStock =
        "Minimum stock must be a whole number of 0 or more.";
    }

    if (!STATUSES.includes(form.status)) {
      nextErrors.status = "Choose a valid status.";
    }

    if (form.operatingVoltage !== "") {
      const voltage = Number(form.operatingVoltage);
      if (!Number.isFinite(voltage) || voltage < 0) {
        nextErrors.operatingVoltage = "Voltage must be a number of 0 or more.";
      }
    }

    if (form.datasheetUrl.trim()) {
      try {
        const parsed = new URL(form.datasheetUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          nextErrors.datasheetUrl = "Use an http or https URL.";
        }
      } catch {
        nextErrors.datasheetUrl = "Enter a valid datasheet URL.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      manufacturer: form.manufacturer.trim(),
      quantity: Number(form.quantity),
      minimumStock: Number(form.minimumStock),
      status: form.status,
      location: form.location.trim(),
      notes: form.notes.trim(),
      communicationProtocols: form.communicationProtocols,
    };

    if (form.architecture.trim()) {
      payload.architecture = form.architecture.trim();
    }

    if (form.operatingVoltage !== "") {
      payload.operatingVoltage = Number(form.operatingVoltage);
    }

    if (form.datasheetUrl.trim()) {
      payload.datasheetUrl = form.datasheetUrl.trim();
    }

    onSubmit(payload);
  };

  const title = component ? "Edit component" : "Add component";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="component-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="component-form-title">{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="banner error" role="alert">
              {serverError}
            </div>
          )}
          <div className="form-grid">
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>

            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="field-error">{errors.category}</span>
              )}
            </label>

            <label>
              Manufacturer
              <input
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
              />
            </label>

            <label>
              Quantity (total units)
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
              {errors.quantity && (
                <span className="field-error">{errors.quantity}</span>
              )}
            </label>

            <label>
              Minimum stock threshold
              <input
                name="minimumStock"
                type="number"
                min="0"
                step="1"
                value={form.minimumStock}
                onChange={handleChange}
                required
              />
              {errors.minimumStock && (
                <span className="field-error">{errors.minimumStock}</span>
              )}
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.status && (
                <span className="field-error">{errors.status}</span>
              )}
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </label>

            <label className="full-width">
              Notes
              <textarea
                name="notes"
                rows="3"
                value={form.notes}
                onChange={handleChange}
              />
            </label>
          </div>

          <fieldset className="hardware-fieldset">
            <legend>Hardware specifications</legend>
            <p className="field-hint">Optional for every category.</p>

            <div className="form-grid">
              <label>
                Microcontroller architecture
                <input
                  name="architecture"
                  list="architecture-options"
                  value={form.architecture}
                  onChange={handleChange}
                  placeholder="ARM Cortex-M4"
                />
                <datalist id="architecture-options">
                  {ARCHITECTURE_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <label>
                Operating voltage (V)
                <input
                  name="operatingVoltage"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.operatingVoltage}
                  onChange={handleChange}
                  placeholder="3.3"
                />
                {errors.operatingVoltage && (
                  <span className="field-error">{errors.operatingVoltage}</span>
                )}
              </label>

              <label className="full-width">
                Datasheet URL
                <input
                  name="datasheetUrl"
                  type="url"
                  value={form.datasheetUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/datasheet.pdf"
                />
                {errors.datasheetUrl && (
                  <span className="field-error">{errors.datasheetUrl}</span>
                )}
              </label>
            </div>

            <fieldset className="protocol-fieldset">
              <legend>Communication protocols</legend>
              <div className="protocol-grid">
                {PROTOCOLS.map((protocol) => {
                  const checked = form.communicationProtocols.includes(protocol);
                  const id = `protocol-${protocol}`;

                  return (
                    <label key={protocol} className="protocol-chip" htmlFor={id}>
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProtocol(protocol)}
                      />
                      {displayProtocol(protocol)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save component"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComponentForm;
