const DEFAULT_PUBLIC_APP_URL = "https://iot-component-vault.vercel.app";

export const isLocalhostUrl = (value) =>
  /localhost|127\.0\.0\.1/i.test(String(value || ""));

export const normalizeAppBaseUrl = (value) =>
  String(value || "").trim().replace(/\/$/, "");

export const getPublicAppBaseUrl = (configuredUrl) => {
  const normalized = normalizeAppBaseUrl(configuredUrl);

  if (normalized && !isLocalhostUrl(normalized)) {
    return normalized;
  }

  return DEFAULT_PUBLIC_APP_URL;
};

export const getComponentQrUrl = (componentId, appBaseUrl) => {
  if (!componentId) {
    throw new Error("Component ID is required to build a QR URL");
  }

  return `${getPublicAppBaseUrl(appBaseUrl)}/components/${componentId}`;
};

export const toQrFilename = (name) => {
  const slug = String(name || "component")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "component"}-QR.png`;
};
