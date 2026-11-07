import { useEffect, useState } from "react";
import { X } from "lucide-react";

const CATEGORIES = ["Microcontroller", "Sensor", "Development Kit", "Other"];
const STATUSES = ["Available", "Deployed"];

const emptyForm = {
  name: "",
  category: "Microcontroller",
  manufacturer: "",
  quantity: 0,
  status: "Available",
  location: "",
  notes: "",
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
        status: component.status || "Available",
        location: component.location || "",
        notes: component.notes || "",
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

    if (!STATUSES.includes(form.status)) {
      nextErrors.status = "Choose a valid status.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      category: form.category,
      manufacturer: form.manufacturer.trim(),
      quantity: Number(form.quantity),
      status: form.status,
      location: form.location.trim(),
      notes: form.notes.trim(),
    });
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
              Quantity
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
