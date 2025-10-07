import React, { createContext, useContext, useEffect, useState } from "react";

// Create the Theme Context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to "light"
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("sap-technologies-theme");
      return savedTheme || "light";
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
      return "light";
    }
  });

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  // Set a specific theme
  const setSpecificTheme = (newTheme) => {
    if (newTheme === "light" || newTheme === "dark") {
      setTheme(newTheme);
    }
  };

  // Effect to apply theme to document and save to localStorage
  useEffect(() => {
    try {
      // Apply theme to document root
      document.documentElement.setAttribute("data-theme", theme);
      
      // Update the CSS color-scheme property
      document.documentElement.style.colorScheme = theme;
      
      // Save to localStorage
      localStorage.setItem("sap-technologies-theme", theme);
      
      // Dispatch custom event for any components that need to listen
      window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
    } catch (error) {
      console.warn("Failed to apply theme:", error);
    }
  }, [theme]);

  // Listen for system theme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't set a preference
      const savedTheme = localStorage.getItem("sap-technologies-theme");
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  // Context value
  const value = {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === "dark",
    isLight: theme === "light"
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;