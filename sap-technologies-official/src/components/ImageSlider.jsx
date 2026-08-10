import React, { useState } from "react";
import "../styles/ImageSlider.css";

const ImageSlider = ({ images, alt = "Image" }) => {
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

  // If only one image, show it without controls
  if (validImages.length === 1) {
    return (
      <div className="image-slider single-image">
        <img src={validImages[0]} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className="image-slider">
      {/* Main Image Display */}
      <div className="slider-image-container">
        <img 
          src={validImages[currentIndex]} 
          alt={`${alt} - ${currentIndex + 1}`}
          className="slider-image"
          loading="lazy"
          decoding="async"
        />
        
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
