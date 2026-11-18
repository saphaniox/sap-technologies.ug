// Production traffic uses same-origin hosting rewrites; local development uses Vite's proxy.
export const API_PROXY_ENABLED = import.meta.env.PROD && import.meta.env.VITE_API_PROXY !== "false";
export const DIRECT_API_URL = String(import.meta.env.VITE_API_PRIMARY_URL || import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const BROWSER_API_BASE_URL = API_PROXY_ENABLED ? "" : DIRECT_API_URL;
