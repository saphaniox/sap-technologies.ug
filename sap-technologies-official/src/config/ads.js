const env = import.meta.env;
const DEFAULT_MONETAG_DOMAIN = "3nbf4.com";
const DEFAULT_MONETAG_ZONE_ID = "11767468";

const clean = (value) => String(value || "").trim();

const toBoolean = (value, fallback = false) => {
  const text = clean(value).toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "yes", "on"].includes(text);
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(clean(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeProvider = (value) => {
  const provider = clean(value).toLowerCase();
  if (!provider || ["none", "off", "disabled"].includes(provider)) return "none";
  if (["adsterra", "monetag"].includes(provider)) return provider;
  return provider;
};

const normalizeUrl = (value) => {
  const url = clean(value);
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
};

const toEnvKey = (placement) => placement.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();

export const AD_PROVIDER = normalizeProvider(env.VITE_AD_PROVIDER || env.VITE_AD_NETWORK || "monetag");

export const AD_SCRIPT_URL = normalizeUrl(
  env.VITE_AD_SCRIPT_URL ||
    (AD_PROVIDER === "monetag" ? env.VITE_MONETAG_SCRIPT_URL : "") ||
    (AD_PROVIDER === "adsterra" ? env.VITE_ADSTERRA_SCRIPT_URL : "")
);

export const AD_ZONE_ID = clean(
  env.VITE_AD_ZONE_ID ||
    env.VITE_MONETAG_ZONE_ID ||
    env.VITE_ADSTERRA_ZONE_ID ||
    (AD_PROVIDER === "monetag" ? DEFAULT_MONETAG_ZONE_ID : "")
);

export const AD_SDK_NAME = clean(env.VITE_AD_SDK_NAME || env.VITE_MONETAG_SDK_NAME);
export const AD_DIRECT_LINK_URL = normalizeUrl(
  env.VITE_AD_DIRECT_LINK_URL ||
    env.VITE_MONETAG_DIRECT_LINK_URL ||
    env.VITE_ADSTERRA_DIRECT_LINK_URL
);
export const AD_ROUTE_TRIGGER_FUNCTION = clean(
  env.VITE_AD_ROUTE_TRIGGER_FUNCTION || env.VITE_MONETAG_ROUTE_TRIGGER_FUNCTION
);
export const AD_ROUTE_TRIGGER_DELAY = toPositiveInteger(env.VITE_AD_ROUTE_TRIGGER_DELAY, 900);
export const AD_SERVICE_WORKER_URL = clean(
  env.VITE_AD_SERVICE_WORKER_URL ||
    env.VITE_MONETAG_SERVICE_WORKER_URL ||
    (AD_PROVIDER === "monetag" ? "/sw.js" : "")
);

const disabled = toBoolean(env.VITE_AD_DISABLED || env.VITE_ADS_DISABLED, false);
const enabledInDev = toBoolean(env.VITE_AD_ENABLE_IN_DEV || env.VITE_ADS_ENABLE_IN_DEV, false);

const placementDefaults = {
  homeTop: { width: 970, height: 90 },
  homeMiddle: { width: 728, height: 90 },
  marketplace: { width: 728, height: 90 },
  pageTop: { width: 970, height: 90 },
  pageBottom: { width: 728, height: 90 },
  software: { width: 728, height: 90 },
  iot: { width: 728, height: 90 }
};

const readPlacement = (placement, defaults) => {
  const key = toEnvKey(placement);
  const providerKey = AD_PROVIDER.toUpperCase();
  const scriptUrl = normalizeUrl(
    env[`VITE_AD_SLOT_${key}_SCRIPT_URL`] ||
      env[`VITE_${providerKey}_${key}_SCRIPT_URL`]
  );
  const zoneId = clean(
    env[`VITE_AD_SLOT_${key}_ID`] ||
      env[`VITE_AD_SLOT_${key}_KEY`] ||
      env[`VITE_${providerKey}_${key}_ID`] ||
      env[`VITE_${providerKey}_${key}_KEY`]
  );
  const directLinkUrl = normalizeUrl(env[`VITE_AD_SLOT_${key}_DIRECT_LINK_URL`]);
  const width = toPositiveInteger(env[`VITE_AD_SLOT_${key}_WIDTH`], defaults.width);
  const height = toPositiveInteger(env[`VITE_AD_SLOT_${key}_HEIGHT`], defaults.height);
  const format = clean(env[`VITE_AD_SLOT_${key}_FORMAT`] || "iframe");

  return {
    placement,
    provider: AD_PROVIDER,
    scriptUrl,
    zoneId,
    directLinkUrl,
    width,
    height,
    format,
    signature: [AD_PROVIDER, scriptUrl, zoneId, directLinkUrl, width, height, format].join("|")
  };
};

export const AD_PLACEMENTS = Object.fromEntries(
  Object.entries(placementDefaults).map(([placement, defaults]) => [
    placement,
    readPlacement(placement, defaults)
  ])
);

const hasConfiguredPlacement = Object.values(AD_PLACEMENTS).some(
  (placement) => placement.scriptUrl || placement.directLinkUrl
);
const hasMonetagServiceWorker = AD_PROVIDER === "monetag" && Boolean(AD_SERVICE_WORKER_URL);

export const AD_NETWORK_ENABLED =
  AD_PROVIDER !== "none" &&
  !disabled &&
  (env.PROD || enabledInDev) &&
  Boolean(AD_SCRIPT_URL || AD_DIRECT_LINK_URL || hasConfiguredPlacement || hasMonetagServiceWorker);

export const AD_AUTO_ENABLED =
  AD_NETWORK_ENABLED && toBoolean(env.VITE_AD_AUTO || env.VITE_AD_AUTO_ADS, true);
export const AD_SERVICE_WORKER_ENABLED = AD_NETWORK_ENABLED && hasMonetagServiceWorker;
