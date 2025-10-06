/**
 * Back To Top Button Component
 * 
 * Animated button that appears when user scrolls down and
 * smoothly scrolls back to page top when clicked.
 * 
 * Features:
 * - Auto-show after scrolling 300px down
 * - Smooth scroll animation to top
 * - Framer Motion animations (fade, scale, bounce)
 * - Hover effects with shadow
 * - Tap feedback animation
 * - Spring physics for natural movement
 * - Arrow icon indicator
 * - Fixed position (bottom-right corner)
 * 
 * Animations:
 * - Entry: Fade in with scale and vertical slide
 * - Exit: Fade out with scale and vertical slide
 * - Hover: Scale up with shadow glow
 * - Tap: Scale down feedback
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import "../styles/BackToTop.css";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className="back-to-top"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17
          }}
          aria-label="Back to top"
          title="Back to top"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12H8V20H16V12H20L12 4Z"
              fill="currentColor"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;