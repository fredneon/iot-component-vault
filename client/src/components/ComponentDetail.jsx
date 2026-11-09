import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { getApiErrorMessage, getComponent } from "../api/client.js";
import { displayProtocol } from "../constants/hardware.js";
import { createQrDataUrl, getComponentQrUrl } from "../utils/qr.js";

function specValue(value) {
  return value === 0 || value ? value : "Not specified";
}

function ComponentDetail() {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setComponent(null);

      try {
        const data = await getComponent(id);
        if (cancelled) {
          return;
        }

        setComponent(data);
        const dataUrl = await createQrDataUrl(getComponentQrUrl(data._id), 240);
        if (!cancelled) {
          setQrSrc(dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "Could not load this component.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const protocols = Array.isArray(component?.communicationProtocols)
    ? component.communicationProtocols
    : [];

  return (
    <div className="detail-page">
      <header className="detail-topbar">
        <Link className="btn ghost" to="/">
          <ArrowLeft size={16} />
          Back to Inventory
        </Link>
      </header>

      <main className="detail-card">
        {loading && <p role="status">Loading component…</p>}

        {!loading && error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}

        {!loading && component && (
          <>
            <p className="brand-kicker">Component record</p>
            <h1>{component.name}</h1>
            <p className="subtitle">
              Scan-friendly identification page. Lab notes and storage details
              stay in the inventory dashboard.
            </p>

            <dl className="detail-grid">
              <div>
                <dt>Manufacturer</dt>
                <dd>{specValue(component.manufacturer)}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{component.category}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{component.quantity}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{component.status}</dd>
              </div>
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
                <dt>Protocols</dt>
                <dd>
                  {protocols.length > 0
                    ? protocols.map(displayProtocol).join(", ")
                    : "Not specified"}
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

            <section className="detail-qr">
              <h2>QR code</h2>
              {qrSrc ? (
                <img src={qrSrc} alt={`QR code for ${component.name}`} />
              ) : (
                <p>Generating QR code…</p>
              )}
              <p className="qr-url">{getComponentQrUrl(component._id)}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ComponentDetail;
