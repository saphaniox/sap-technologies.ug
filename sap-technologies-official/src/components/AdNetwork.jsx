import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AD_AUTO_ENABLED,
  AD_DIRECT_LINK_URL,
  AD_NETWORK_ENABLED,
  AD_PLACEMENTS,
  AD_PROVIDER,
  AD_ROUTE_TRIGGER_DELAY,
  AD_ROUTE_TRIGGER_FUNCTION,
  AD_SERVICE_WORKER_ENABLED,
  AD_SERVICE_WORKER_URL,
  AD_SCRIPT_URL,
  AD_SDK_NAME,
  AD_ZONE_ID
} from "../config/ads";
import "../styles/Ads.css";

const loadedScripts = new Set();

const providerNames = {
  adsterra: "Adsterra",
  monetag: "Monetag"
};

const escapeHtmlAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const safeScriptJson = (value) => JSON.stringify(value).replaceAll("</script", "<\\/script");

const appendScript = ({ id, src, zoneId, sdkName, parent = document.head }) => {
  if (!src || document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;

  if (zoneId) {
    script.dataset.zone = zoneId;
    script.dataset.key = zoneId;
  }

  if (sdkName) {
    script.dataset.sdk = sdkName;
  }

  parent.appendChild(script);
  loadedScripts.add(id);
};

const buildAdFrameHtml = (placement) => {
  const scriptAttributes = [
    `src="${escapeHtmlAttribute(placement.scriptUrl)}"`,
    "async"
  ];

  if (placement.zoneId) {
    scriptAttributes.push(`data-zone="${escapeHtmlAttribute(placement.zoneId)}"`);
    scriptAttributes.push(`data-key="${escapeHtmlAttribute(placement.zoneId)}"`);
  }

  if (AD_SDK_NAME) {
    scriptAttributes.push(`data-sdk="${escapeHtmlAttribute(AD_SDK_NAME)}"`);
  }

  const adOptions =
    placement.provider === "adsterra" && placement.zoneId
      ? `<script>window.atOptions = ${safeScriptJson({
          key: placement.zoneId,
          format: placement.format || "iframe",
          height: placement.height,
          width: placement.width,
          params: {}
        })};</script>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <base target="_blank">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <style>
      html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
      body { min-height: ${placement.height}px; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    ${adOptions}
    <script ${scriptAttributes.join(" ")}></script>
  </body>
</html>`;
};

const AdNetwork = () => {
  const location = useLocation();

  useEffect(() => {
    if (
      !AD_SERVICE_WORKER_ENABLED ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register(AD_SERVICE_WORKER_URL).catch((error) => {
      console.warn(`${providerNames[AD_PROVIDER] || "Ad"} service worker could not be registered:`, error);
    });
  }, []);

  useEffect(() => {
    if (!AD_AUTO_ENABLED || !AD_SCRIPT_URL || typeof document === "undefined") return;

    appendScript({
      id: `saptech-${AD_PROVIDER}-ads-script`,
      src: AD_SCRIPT_URL,
      zoneId: AD_ZONE_ID,
      sdkName: AD_SDK_NAME
    });
  }, []);

  useEffect(() => {
    if (!AD_NETWORK_ENABLED || !AD_ROUTE_TRIGGER_FUNCTION || typeof window === "undefined") return undefined;

    const timer = window.setTimeout(() => {
      const trigger = window[AD_ROUTE_TRIGGER_FUNCTION];

      if (typeof trigger === "function") {
        Promise.resolve(trigger()).catch((error) => {
          console.warn(`${providerNames[AD_PROVIDER] || "Ad"} route ad could not be shown:`, error);
        });
      }
    }, AD_ROUTE_TRIGGER_DELAY);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
};

export const AdPlacement = ({ placement = "pageTop", className = "" }) => {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const adPlacement = AD_PLACEMENTS[placement];
  const directLinkUrl = adPlacement?.directLinkUrl || AD_DIRECT_LINK_URL;

  useEffect(() => {
    const container = containerRef.current;
    setIsReady(false);

    if (!AD_NETWORK_ENABLED || !adPlacement || !container) return undefined;
    if (!adPlacement.scriptUrl && !directLinkUrl) return undefined;

    container.textContent = "";

    if (adPlacement.scriptUrl) {
      const iframe = document.createElement("iframe");
      iframe.title = `${providerNames[AD_PROVIDER] || "Ad"} sponsored placement`;
      iframe.className = "ad-placement-frame";
      iframe.width = String(adPlacement.width);
      iframe.height = String(adPlacement.height);
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.sandbox =
        "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms";
      iframe.srcdoc = buildAdFrameHtml(adPlacement);
      container.appendChild(iframe);
    }

    if (!adPlacement.scriptUrl && directLinkUrl) {
      const link = document.createElement("a");
      link.className = "ad-placement-link";
      link.href = directLinkUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer sponsored";
      link.textContent = "Sponsored technology resource";
      container.appendChild(link);
    }

    setIsReady(true);

    return () => {
      container.textContent = "";
    };
  }, [adPlacement?.signature, directLinkUrl]);

  if (!AD_NETWORK_ENABLED || !adPlacement || (!adPlacement.scriptUrl && !directLinkUrl)) {
    return null;
  }

  const placementClassName = [
    "ad-placement",
    isReady ? "ad-placement--ready" : "",
    `ad-placement--${placement.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <aside className={placementClassName} aria-label="Sponsored">
      <div
        ref={containerRef}
        className="ad-placement-inner"
        style={{
          "--ad-placement-width": `${adPlacement.width}px`,
          "--ad-placement-height": `${adPlacement.height}px`
        }}
      />
    </aside>
  );
};

export default AdNetwork;
