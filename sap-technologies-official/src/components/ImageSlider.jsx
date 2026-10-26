import React, { useState } from "react";
import "../styles/ImageSlider.css";

const ImageSlider = ({
  images,
  alt = "Image",
  imageHref = "",
  imageLinkLabel = "",
  onImageLinkClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle empty or invalid images
  if (!images || images.length === 0) {
    return null;
  }

  // Normalize images to array of strings
  const imageArray = Array.isArray(images) ? images : [images];
  const validImages = imageArray.filter(img => img);

  if (validImages.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const renderLinkedImage = (image, imageAlt, className = "") => {
    const imageElement = (
      <img
        src={image}
        alt={imageAlt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );

    if (!imageHref) return imageElement;

    return (
      <a
        className="slider-image-link"
        href={imageHref}
        aria-label={imageLinkLabel || `Open ${alt}`}
        onClick={onImageLinkClick}
      >
        {imageElement}
      </a>
    );
  };

  // If only one image, show it without controls
  if (validImages.length === 1) {
    return (
      <div className="image-slider single-image">
        {renderLinkedImage(validImages[0], alt)}
      </div>
    );
  }

  return (
    <div className="image-slider">
      {/* Main Image Display */}
      <div className="slider-image-container">
        {renderLinkedImage(
          validImages[currentIndex],
          `${alt} - ${currentIndex + 1}`,
          "slider-image"
        )}

        {/* Navigation Arrows */}
        <button
          className="slider-button slider-button-prev"
          onClick={goToPrevious}
          aria-label="Previous image"
        >
          &#10094;
        </button>
        <button
          className="slider-button slider-button-next"
          onClick={goToNext}
          aria-label="Next image"
        >
          &#10095;
        </button>

        {/* Image Counter */}
        <div className="slider-counter">
          {currentIndex + 1} / {validImages.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="slider-thumbnails">
        {validImages.map((image, index) => (
          <button
            key={index}
            className={`thumbnail ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to image ${index + 1}`}
          >
            <img src={image} alt={`Thumbnail ${index + 1}`} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
