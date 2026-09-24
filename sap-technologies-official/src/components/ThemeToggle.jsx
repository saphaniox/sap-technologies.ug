import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/ThemeToggle.css";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="toggle-svg sun-svg" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="1.5" x2="12" y2="4.2" />
      <line x1="12" y1="19.8" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4.2" y2="12" />
      <line x1="19.8" y1="12" x2="22.5" y2="12" />
      <line x1="4.3" y1="4.3" x2="6.2" y2="6.2" />
      <line x1="17.8" y1="17.8" x2="19.7" y2="19.7" />
      <line x1="4.3" y1="19.7" x2="6.2" y2="17.8" />
      <line x1="17.8" y1="6.2" x2="19.7" y2="4.3" />
    </g>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="toggle-svg moon-svg" aria-hidden="true">
    <path
      d="M21 12.8A9 9 0 0 1 11.2 3a8 8 0 1 0 9.8 9.8Z"
      fill="currentColor"
    />
  </svg>
);

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
        <div className="theme-toggle-track">
          <div className="theme-toggle-icons">
            <motion.span
              className="theme-icon sun-icon"
              animate={isDark ? iconVariants.dark : iconVariants.light}
              transition={{ duration: 0.3 }}
            >
              <SunIcon />
            </motion.span>
            <motion.span
              className="theme-icon moon-icon"
              animate={isDark ? iconVariants.dark : iconVariants.light}
              transition={{ duration: 0.3 }}
            >
              <MoonIcon />
            </motion.span>
          </div>

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
              {isDark ? <MoonIcon /> : <SunIcon />}
            </motion.div>
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default ThemeToggle;
