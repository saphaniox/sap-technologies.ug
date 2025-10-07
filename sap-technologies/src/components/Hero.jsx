/**
 * Hero Component
 * 
 * Landing section with animated typing effect and call-to-action buttons.
 * Features include:
 * - Rotating typewriter animation showcasing our services
 * - 3D animated background
 * - Interactive CTA buttons with loading states
 * - Smooth scrolling navigation to other sections
 * - Responsive design for all devices
 * 
 * @component
 */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Background3D from "./Background3D";
import { withLoading } from "../utils/alerts.jsx";
import "../styles/Hero.css";

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
  const texts = ["Web Design", "Graphics Design", "Electrical & Electronics Engineering", "Software Engineering"];

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
  const handleGetStarted = async () => {
    try {
      await withLoading(
        async () => {
          // Simulate brief loading for better UX
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const servicesSection = document.getElementById("services");
          if (servicesSection) {
            servicesSection.scrollIntoView({ 
              behavior: "smooth",
              block: "start"
            });
          }
        },
        {
          loadingTitle: "Getting Started! 🚀",
          loadingText: "Preparing our services for you...",
          successTitle: "Let\"s Get Started!",
          successText: "Explore our services below to find the perfect solution for your needs.",
          showSuccess: true
        }
      );
    } catch (error) {
      console.error("Error navigating to services:", error);
    }
  };

  /**
   * Navigate to Portfolio Section
   * Scrolls to featured projects with loading animation
   */
  const handleViewProjects = async () => {
    try {
      await withLoading(
        async () => {
          // Simulate brief loading for better UX
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const portfolioSection = document.getElementById("portfolio");
          if (portfolioSection) {
            portfolioSection.scrollIntoView({ 
              behavior: "smooth",
              block: "start"
            });
          } else {
            throw new Error("Portfolio section not found");
          }
        },
        {
          loadingTitle: "Loading Projects! 🎯",
          loadingText: "Preparing our featured projects for you...",
          successTitle: "Our Featured Projects",
          successText: "Check out our amazing work and successful client projects below!",
          showSuccess: true,
          showError: true,
          errorTitle: "Coming Soon! 🔥",
          errorText: "Our featured projects showcase is being updated. Contact us to see our latest work!"
        }
      );
    } catch (error) {
      console.error("Error navigating to projects:", error);
    }
  };

  return (
    <motion.section 
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Background3D />
      
      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-20, -100] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
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
          <span>✨ Welcome to SAP-Technologies</span>
        </motion.div>

        <motion.h1 className="hero-title">
          <span className="title-line">Professional</span>
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

        <motion.p className="hero-subtitle">
          Transforming your imaginations to real life.
        </motion.p>

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
