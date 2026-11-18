const backendOrigins = ["https://api.saptechug.com", "https://sap-technologies-ug.onrender.com"];

// Map only our API and uploaded files, never arbitrary external project links.
export const publicBackendUrl = (value, baseURL = "", extraOrigins = []) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return `${baseURL}${trimmed}`;
  try {
    const url = new URL(trimmed);
    const origins = [...backendOrigins, ...extraOrigins].filter(Boolean).map(origin => new URL(origin).origin);
    if (origins.includes(url.origin) && /^\/(api|uploads)(\/|$)/.test(url.pathname)) {
      return `${baseURL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch { /* Leave non-URL values unchanged. */ }
  return value;
};

export const mapBackendUrls = (value, baseURL = "", extraOrigins = []) => {
  if (typeof value === "string") return publicBackendUrl(value, baseURL, extraOrigins);
  if (Array.isArray(value)) return value.map(item => mapBackendUrls(item, baseURL, extraOrigins));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapBackendUrls(item, baseURL, extraOrigins)]));
  }
  return value;
};
