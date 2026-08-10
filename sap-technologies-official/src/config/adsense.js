const DEFAULT_ADSENSE_CLIENT = "ca-pub-7847110611874114";
const DEFAULT_ADSENSE_SLOTS = {
  homeTop: "2403405277",
  homeMiddle: "9455898784",
  marketplace: "2100152948",
  pageTop: "9731230954",
  pageBottom: "4478904270",
  software: "4967961655",
  iot: "5479097545"
};

const normalizePublisherId = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("ca-pub-")) return trimmed;
  if (trimmed.startsWith("pub-")) return `ca-${trimmed}`;
  return trimmed;
};

export const ADSENSE_CLIENT = normalizePublisherId(
  import.meta.env.VITE_ADSENSE_CLIENT ||
  import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT ||
  DEFAULT_ADSENSE_CLIENT
);

const hasValidClient = /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT);
const disabled = import.meta.env.VITE_ADSENSE_DISABLED === "true";
const enabledInDev = import.meta.env.VITE_ADSENSE_ENABLE_IN_DEV === "true";

export const ADSENSE_ENABLED = hasValidClient && !disabled && (import.meta.env.PROD || enabledInDev);
export const ADSENSE_AUTO_ADS = ADSENSE_ENABLED && import.meta.env.VITE_ADSENSE_AUTO_ADS !== "false";

export const ADSENSE_SLOTS = {
  homeTop: import.meta.env.VITE_ADSENSE_SLOT_HOME_TOP || DEFAULT_ADSENSE_SLOTS.homeTop,
  homeMiddle: import.meta.env.VITE_ADSENSE_SLOT_HOME_MIDDLE || DEFAULT_ADSENSE_SLOTS.homeMiddle,
  marketplace: import.meta.env.VITE_ADSENSE_SLOT_MARKETPLACE || DEFAULT_ADSENSE_SLOTS.marketplace,
  pageTop: import.meta.env.VITE_ADSENSE_SLOT_PAGE_TOP || DEFAULT_ADSENSE_SLOTS.pageTop,
  pageBottom: import.meta.env.VITE_ADSENSE_SLOT_PAGE_BOTTOM || DEFAULT_ADSENSE_SLOTS.pageBottom,
  software: import.meta.env.VITE_ADSENSE_SLOT_SOFTWARE || DEFAULT_ADSENSE_SLOTS.software,
  iot: import.meta.env.VITE_ADSENSE_SLOT_IOT || DEFAULT_ADSENSE_SLOTS.iot
};
