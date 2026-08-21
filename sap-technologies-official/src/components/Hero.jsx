import React, { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import "../styles/Hero.css";

// Three.js is 854 kB — lazy-load so it never blocks the initial paint
const Background3D = lazy(() => import("./Background3D"));

const Hero = () => {
  /**
   * Typing Animation State
   */
  // Currently displayed text in typing animation
  const [currentText, setCurrentText] = useState("");
  // Index of current service being displayed
  const [textIndex, setTextIndex] = useState(0);

  /**
   * Service texts that rotate in typing animation
   */
  const texts = ["Web Design", "Electrical & Electronics", "Engineering & Technology", "Batteries (Lithium-ion) & Power", "IoT & System Design Integration", "Graphics Design"];

  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, index) => ({
        id: index,
        left: `${((index * 11.7) % 100).toFixed(2)}%`,
        top: `${((index * 17.3 + 7) % 100).toFixed(2)}%`,
        delay: Number(((index * 0.45) % 3).toFixed(2))
      })),
    []
  );

  /**
   * Typing Animation Effect
   * Creates typewriter effect that types and deletes service names
   */
  useEffect(() => {
    const text = texts[textIndex];
    let currentIndex = 0;
    let isDeleting = false;

    // Timer for typing/deleting characters
    const typeTimer = setInterval(() => {
      if (!isDeleting && currentIndex <= text.length) {
        setCurrentText(text.substring(0, currentIndex));
        currentIndex++;
      } else if (!isDeleting && currentIndex > text.length) {
        setTimeout(() => { isDeleting = true; }, 2000);
      } else if (isDeleting && currentIndex >= 0) {
        setCurrentText(text.substring(0, currentIndex));
        currentIndex--;
      } else {
        isDeleting = false;
        setTextIndex((prev) => (prev + 1) % texts.length);
      }
    }, isDeleting ? 50 : 100);

    return () => clearInterval(typeTimer);
  }, [textIndex]);

  /**
   * Navigate to Services Section
   * Scrolls to services with loading animation for better UX
   */
  const handleGetStarted = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /**
   * Navigate to Portfolio Section
   * Scrolls to featured projects with loading animation
   */
  const handleViewProjects = () => {
    const portfolioSection = document.getElementById("portfolio");
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.section 
      id="home"
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>
      
      <div className="floating-particles" aria-hidden="true">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-20, -100] }}
            transition={{ duration: 3, repeat: Infinity, delay: particle.delay }}
          />
        ))}
      </div>

      <motion.div 
        className="hero-content"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <motion.div
          className="welcome-badge"
          whileHover={{ scale: 1.1 }}
        >
          <span>✨ Welcome to SAPTech Uganda</span>
        </motion.div>

        <motion.h1 className="hero-title">
          <span className="title-line">Professional in </span>
          <span className="title-line highlight">
            <span className="typewriter-text">{currentText}</span>
            <motion.span
              className="cursor"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              |
            </motion.span>
          </span>
          <span className="title-line">Solutions</span>
        </motion.h1>

        <motion.div className="hero-buttons">
          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
          >
            Get Started →
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewProjects}
          >
            View Our Featured Projects
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;
