/**
 * Slider Component
 * 
 * Image carousel/slider showcasing key services and offerings.
 * 
 * Features:
 * - Auto-advancing slides (5-second intervals)
 * - Manual navigation (previous/next buttons)
 * - Slide indicators/dots for direct navigation
 * - Smooth fade transitions
 * - Responsive images
 * - Title and description overlay
 * - Pause on hover (optional)
 * 
 * Slides Include:
 * - Web Design services
 * - Graphics Design & Logo
 * - Electrical Engineering
 * - Software Solutions
 * - Business Platforms
 * - Learning Management System
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import "../styles/Slider.css";

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/images/slider1.jpg",
      title: "Innovative Web Design",
      description: "Transforming your ideas into stunning digital experiences."
    },
    {
      image: "/images/slider2.jpg",
      title: "Creative Graphics & Logo",
      description: "Branding that makes your business unforgettable."
    },
    {
      image: "/images/slider3.jpg",
      title: "Electrical Engineering Excellence",
      description: "Reliable, safe, and efficient engineering solutions."
    },
    {
      image: "/images/slider4.jpg",
      title: "Smart Software Solutions",
      description: "Custom software to power your business growth."
    },
    {
      image: "/images/banner2.jpg",
      title: "Business Platforms",
      description: "Empowering Ugandan businesses with modern technology solutions."
    },
    {
      image: "/images/GRAPHICS-DESIGN.jpg",
      title: "Graphics Design Excellence",
      description: "Stunning visuals and creative branding for your business growth."
    },
    {
      image: "/images/LMS.jpg",
      title: "Learning Management System",
      description: "Empowering education with digital tools and analytics."
    }
  ];

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="slider-section">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slider-slide ${index === currentSlide ? "active" : ""}`}
          >
            <img src={slide.image} alt={slide.title} />
            <div className="slider-caption slider-caption-overlay">
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
          </div>
        ))}
        
        <button 
          className="slider-arrow left" 
          onClick={prevSlide}
          aria-label="Previous Slide"
        >
          &#10094;
        </button>
        
        <button 
          className="slider-arrow right" 
          onClick={nextSlide}
          aria-label="Next Slide"
        >
          &#10095;
        </button>
        
        <div className="slider-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Slider;
