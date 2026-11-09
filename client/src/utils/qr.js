import QRCode from "qrcode";

const PRODUCTION_APP_URL = "https://iot-component-vault.vercel.app";

const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4,
  color: {
    dark: "#111111",
    light: "#ffffff",
  },
};

const isLocalhostUrl = (value) =>
  /localhost|127\.0\.0\.1/i.test(String(value || ""));

const normalizeAppBaseUrl = (value) =>
  String(value || "").trim().replace(/\/+$/, "");

export const getPublicAppBaseUrl = () => {
  const configured = normalizeAppBaseUrl(import.meta.env.VITE_PUBLIC_APP_URL);

  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const origin = normalizeAppBaseUrl(window.location.origin);
    if (origin && !isLocalhostUrl(origin)) {
      return origin;
    }
  }

  return PRODUCTION_APP_URL;
};

export const getComponentQrUrl = (componentId) => {
  if (!componentId) {
    throw new Error("Component ID is required to build a QR URL");
  }

  return `${getPublicAppBaseUrl()}/components/${componentId}`;
};

export const toQrFilename = (name,id) => {
  const slug = String(name || "component")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

    const shortId = String(id || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8);

  return `${slug +"-"+ shortId || "component"}-QR.png`;
};

export const createQrDataUrl = (text, width = 280) =>
  QRCode.toDataURL(text, { ...QR_OPTIONS, width });

export const downloadQrPng = async (component) => {
  const url = getComponentQrUrl(component._id);
  const dataUrl = await createQrDataUrl(url, 1024);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = toQrFilename(component.name,component._id);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { url, filename: toQrFilename(component.name,component._id) };
};
