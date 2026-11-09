import { useEffect, useState } from "react";
import { Copy, Download, Printer, X } from "lucide-react";
import {
  createQrDataUrl,
  downloadQrPng,
  getComponentQrUrl,
} from "../utils/qr.js";

function shortId(id) {
  const value = String(id || "");
  return value.slice(-8).toUpperCase();
}

function QrModal({ component, onClose }) {
  const [qrSrc, setQrSrc] = useState("");
  const [status, setStatus] = useState("");
  const qrUrl = component ? getComponentQrUrl(component._id) : "";

  useEffect(() => {
    if (!component) {
      return undefined;
    }

    let cancelled = false;

    createQrDataUrl(qrUrl, 320)
      .then((dataUrl) => {
        if (!cancelled) {
          setQrSrc(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Could not generate the QR code.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [component, qrUrl]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!component) {
    return null;
  }

  const handleDownload = async () => {
    try {
      await downloadQrPng(component);
      setStatus("QR code downloaded.");
    } catch {
      setStatus("Download failed. Try again.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setStatus("Component link copied.");
    } catch {
      setStatus("Could not copy the link.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal qr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="qr-title">Component QR code</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close QR code dialog"
          >
            <X size={18} />
          </button>
        </header>

        <p className="qr-name">{component.name}</p>
        <p className="qr-id">
          ID {String(component._id)} · label {shortId(component._id)}
        </p>

        <div className="qr-preview">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR code for ${component.name}`} />
          ) : (
            <p>Generating QR code…</p>
          )}
        </div>

        <p className="qr-url">{qrUrl}</p>
        {status && (
          <p className="qr-status" role="status">
            {status}
          </p>
        )}

        <div className="modal-actions qr-actions">
          <button type="button" className="btn ghost" onClick={handleCopy}>
            <Copy size={16} />
            Copy link
          </button>
          <button type="button" className="btn ghost" onClick={handleDownload}>
            <Download size={16} />
            Download PNG
          </button>
          <button type="button" className="btn primary" onClick={handlePrint}>
            <Printer size={16} />
            Print label
          </button>
        </div>
      </div>

      <div className="print-label" aria-hidden="true">
        {qrSrc && <img src={qrSrc} alt="" />}
        <div>
          <p className="print-name">{component.name}</p>
          <p>ID {shortId(component._id)}</p>
          <p>{component.category || "Uncategorized"}</p>
          <p>{component.location || "Location not specified"}</p>
        </div>
      </div>
    </div>
  );
}

export default QrModal;
