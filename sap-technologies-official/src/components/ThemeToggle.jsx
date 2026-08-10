import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/ThemeToggle.css";

const ThemeToggle = ({ className = "", showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const toggleVariants = {
    light: { x: 0 },
    dark: { x: 24 }
  };

  const iconVariants = {
    light: { 
      rotate: 0,
      scale: 1,
      opacity: 1
    },
    dark: { 
      rotate: 180,
      scale: 0.8,
      opacity: 0.9
    }
  };

  return (
    <div className={`theme-toggle-container ${className}`}>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Dark" : "Light"} Mode
        </span>
      )}
      
      <motion.button
        className={`theme-toggle ${isDark ? "dark" : "light"}`}
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {/* Toggle Track */}
        <div className="theme-toggle-track">
          {/* Background Icons */}
          <div className="theme-toggle-icons">
            <motion.div
              className="theme-icon sun-icon"
              animate={isDark ? iconVariants.dark : iconVariants.light}
              transition={{ duration: 0.3 }}
            >
              ☀️
            </motion.div>
            <motion.div
              className="theme-icon moon-icon"
              animate={isDark ? iconVariants.dark : iconVariants.light}
              transition={{ duration: 0.3 }}
            >
              🌙
            </motion.div>
          </div>
          
          {/* Toggle Thumb */}
          <motion.div
            className="theme-toggle-thumb"
            animate={toggleVariants[theme]}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          >
            <motion.div
              className="thumb-icon"
              animate={{ rotate: isDark ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {isDark ? "🌙" : "☀️"}
            </motion.div>
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default ThemeToggle;