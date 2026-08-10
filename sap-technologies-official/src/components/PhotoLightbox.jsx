import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/PhotoLightbox.css";

const CONTROL_SELECTOR = "button, a, label, input, textarea, select";
const IGNORED_AREA_SELECTOR = ".header, footer, .footer, .nav-sidebar, .slider-thumbnails, .photo-lightbox";
const PHOTO_CONTAINER_SELECTOR = ".product-image";

const isLogoOrUtilityImage = (image) => {
  const src = image.currentSrc || image.src || "";
  const className = String(image.className || "").toLowerCase();
  const alt = String(image.alt || "").toLowerCase();

  return (
    src.startsWith("data:image/svg+xml") ||
    src.includes("/images/logo") ||
    className.includes("logo") ||
    className.includes("icon") ||
    className.includes("signature") ||
    alt.includes("logo") ||
    alt.includes("signature")
  );
};

const getPhotoFromEvent = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  if (target.closest(CONTROL_SELECTOR) || target.closest(IGNORED_AREA_SELECTOR)) return null;

  const container = target.closest(PHOTO_CONTAINER_SELECTOR);
  if (!container) return null;

  const directImage = target instanceof HTMLImageElement ? target : null;
  const image = directImage || Array.from(container.querySelectorAll("img"))
    .find((candidate) => !candidate.closest(".slider-thumbnails"));

  if (!image || isLogoOrUtilityImage(image)) return null;

  const src = image.currentSrc || image.src;
  if (!src) return null;

  return {
    src,
    alt: image.alt || "SAPTech photo"
  };
};

const PhotoLightbox = () => {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const nextPhoto = getPhotoFromEvent(event);
      if (!nextPhoto) return;

      event.preventDefault();
      event.stopPropagation();
      setPhoto(nextPhoto);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  useEffect(() => {
    if (!photo) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPhoto(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo]);

  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={photo.alt}>
      <button
        type="button"
        className="photo-lightbox-backdrop"
        onClick={() => setPhoto(null)}
        aria-label="Close photo viewer"
      />
      <div className="photo-lightbox-panel">
        <div className="photo-lightbox-frame">
          <img src={photo.src} alt={photo.alt} className="photo-lightbox-image" />
        </div>
        <div className="photo-lightbox-actions">
          <button type="button" className="photo-lightbox-close" onClick={() => setPhoto(null)}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoLightbox;
