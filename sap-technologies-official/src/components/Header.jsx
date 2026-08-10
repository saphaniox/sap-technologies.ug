import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { getImageUrl } from "../utils/imageUrl";
import apiService from "../services/api";
import "../styles/Header.css";

const Motion = motion;

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const extractSearchResults = (response) => {
  const result = response?.results || response?.data?.results || response?.data || response;
  if (!result || typeof result !== "object") return null;

  return {
    products: toArray(result.products),
    services: toArray(result.services),
    projects: toArray(result.projects)
  };
};

const getPublicList = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.[key])) return response[key];
  return [];
};

const searchText = (item, fields) => fields
  .flatMap((field) => {
    const value = item?.[field];
    if (Array.isArray(value)) {
      return value.map((entry) => typeof entry === "object" ? Object.values(entry).join(" ") : String(entry));
    }
    if (value && typeof value === "object") return Object.values(value).join(" ");
    return value ? String(value) : "";
  })
  .join(" ")
  .toLowerCase();

const filterSearchItems = (items, query, fields) => {
  const q = query.toLowerCase();
  return items
    .filter((item) => searchText(item, fields).includes(q))
    .slice(0, 8);
};

const fallbackSearch = async (query) => {
  const [productsResponse, servicesResponse, projectsResponse] = await Promise.allSettled([
    apiService.getProducts({ limit: 500 }),
    apiService.getPublicServices(),
    apiService.getPublicProjects()
  ]);

  const products = productsResponse.status === "fulfilled" ? getPublicList(productsResponse.value, "products") : [];
  const services = servicesResponse.status === "fulfilled" ? getPublicList(servicesResponse.value, "services") : [];
  const projects = projectsResponse.status === "fulfilled" ? getPublicList(projectsResponse.value, "projects") : [];

  return {
    products: filterSearchItems(products, query, ["name", "shortDescription", "technicalDescription", "description", "category", "tags", "features"]),
    services: filterSearchItems(services, query, ["title", "name", "description", "longDescription", "category", "features", "technologies"]),
    projects: filterSearchItems(projects, query, ["title", "name", "description", "longDescription", "category", "technologies", "techStack"])
  };
};

const hasSearchResults = (results) => Boolean(
  results?.products?.length || results?.services?.length || results?.projects?.length
);

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Projects" },
  { id: "software", label: "Software Apps", route: "/software" },
  { id: "iot", label: "IoT Projects", route: "/iot" },
  { id: "gallery", label: "Gallery", route: "/gallery" },
  { id: "awards", label: "SAPTech Awards 2026", route: "/awards" },
  { id: "careers", label: "Careers", route: "/careers" },
  { id: "products", label: "Products" },
  { id: "partners", label: "Partners" },
  { id: "companies", label: "Companies" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contacts" }
];

const Header = ({ isAuthenticated, userName, userRole, userProfilePic, onAuthModalOpen, onAccountOpen, onAdminOpen, onLogout, onNavigate, legalOpen = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchTimerRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  
  const location = useLocation();
  const isAwardsPage = location.pathname === "/awards";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 700);
    };
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const focusSearchInput = useCallback(() => {
    const input = searchInputRef.current;
    if (!input) return;

    input.focus({ preventScroll: true });
    input.setSelectionRange?.(input.value.length, input.value.length);
  }, []);

  const closeSearch = useCallback(() => {
    searchRequestIdRef.current += 1;
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    setSearchError("");
    setSearchLoading(false);
    clearTimeout(searchTimerRef.current);
  }, []);

  const toggleMenu = () => {
    if (!menuOpen) closeSearch();
    setMenuOpen(open => !open);
  };

  const openSearch = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    clearTimeout(searchTimerRef.current);

    if (searchOpen) {
      focusSearchInput();
      return;
    }

    flushSync(() => {
      setMenuOpen(false);
      setSearchOpen(true);
    });

    focusSearchInput();

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(focusSearchInput);
      window.setTimeout(focusSearchInput, 80);
      window.setTimeout(focusSearchInput, 250);
    }
  }, [focusSearchInput, searchOpen]);

  const handleSearchButtonPointerDown = (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      openSearch(event);
    }
  };

  useEffect(() => {
    if (!searchOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSearch();
    };
    const handlePointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) closeSearch();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    focusSearchInput();
    const frame = window.requestAnimationFrame(focusSearchInput);
    const timer = window.setTimeout(focusSearchInput, 80);
    const lateTimer = window.setTimeout(focusSearchInput, 250);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.clearTimeout(lateTimer);
    };
  }, [closeSearch, focusSearchInput, searchOpen]);

  const performSearch = useCallback(async (rawQuery) => {
    const query = rawQuery.trim();
    if (query.length < 1) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearchLoading(true);
    setSearchError("");

    try {
      let results = null;

      try {
        const res = await apiService.search(query);
        results = extractSearchResults(res);
      } catch {
        results = null;
      }

      if (!hasSearchResults(results)) {
        results = await fallbackSearch(query);
      }

      if (requestId !== searchRequestIdRef.current) return;

      setSearchResults(results);
      setSearchError("");
    } catch {
      if (requestId !== searchRequestIdRef.current) return;

      setSearchResults(null);
      setSearchError("Search is not available right now. Please try again.");
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setSearchLoading(false);
      }
    }
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchError("");
    clearTimeout(searchTimerRef.current);
    if (val.trim().length < 1) {
      searchRequestIdRef.current += 1;
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 400);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    clearTimeout(searchTimerRef.current);
    performSearch(searchQuery);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveLink(sectionId);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const prepareNavigation = () => {
    closeMenu();
    onNavigate?.();
  };

  const handleHomeNavigation = () => {
    prepareNavigation();
    if (location.pathname !== "/" || isAwardsPage) {
      window.location.href = "/";
      return;
    }
    window.setTimeout(() => scrollToSection("home"), 0);
  };

  const handleSectionNavigation = (event, sectionId) => {
    event.preventDefault();
    prepareNavigation();

    if (location.pathname !== "/" || isAwardsPage) {
      window.location.href = `/#${sectionId}`;
      return;
    }

    window.setTimeout(() => scrollToSection(sectionId), 0);
  };
  const handleSearchResultNavigation = (event, sectionId) => {
    event.preventDefault();
    closeSearch();
    onNavigate?.();

    if (location.pathname !== "/" || isAwardsPage) {
      window.location.href = `/#${sectionId}`;
      return;
    }

    window.setTimeout(() => scrollToSection(sectionId), 0);
  };

  const handleMenuAction = (callback) => {
    prepareNavigation();
    callback?.();
  };

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        duration: 1,
        ease: "easeOut",
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    }
  };

  const linkVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    hover: {
      scale: 1.1,
      y: -2,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, delay: 0.5 }
    }
  };

  return (
    <Motion.header
      className={`header ${isMobile ? "mobile" : "desktop"} ${isScrolled ? "scrolled" : ""} ${legalOpen ? "legal-open" : ""}`}
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <Motion.nav className={`nav ${userRole === "admin" ? "nav-admin" : ""} ${searchOpen ? "nav-search-active" : ""}`}>
        {/* Animated background glow */}
        <Motion.div
          className={`nav-glow ${userRole === "admin" ? "nav-glow-admin" : ""}`}
          variants={glowVariants}
        />
        
        <Motion.div
          className="logo"
          variants={logoVariants}
          whileHover="hover"
          whileTap={{ scale: 0.9 }}
          onClick={handleHomeNavigation}
          style={{ cursor: "pointer" }}
        >
          <Motion.img
            src="/images/logo.png" 
            alt="SAP Logo" 
            className="logo-img"
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <Motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            SAPTech Uganda
          </Motion.span>
        </Motion.div>

        {/* Center Search */}
        <Motion.div
          className={`nav-search ${searchOpen ? "open" : ""}`}
          ref={searchRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {!searchOpen ? (
            <Motion.button
              type="button"
              className="nav-search-btn"
              onClick={openSearch}
              onPointerDown={handleSearchButtonPointerDown}
              title="Search products, services and projects"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Open search"
              aria-expanded={searchOpen}
            >
              <span className="nav-search-icon" aria-hidden="true">Search</span>
              <span className="nav-search-text">Products, services, projects</span>
            </Motion.button>
          ) : (
            <Motion.form
              className="nav-search-form"
              role="search"
              onSubmit={handleSearchSubmit}
              onClick={() => searchInputRef.current?.focus({ preventScroll: true })}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <span className="nav-search-icon nav-search-form-icon" aria-hidden="true">Search</span>
              <input
                ref={searchInputRef}
                type="search"
                autoFocus
                value={searchQuery}
                onChange={handleSearchInput}
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search products, services, projects..."
                className="nav-search-input"
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-input-clear nav-search-clear"
                  onClick={() => { setSearchQuery(""); setSearchResults(null); setSearchError(""); searchInputRef.current?.focus(); }}
                  aria-label="Clear search"
                >
                  x
                </button>
              )}
              <button type="button" className="nav-search-close" onClick={closeSearch} aria-label="Close search">
                x
              </button>
            </Motion.form>
          )}

          <AnimatePresence>
            {searchOpen && (
              <Motion.div
                className="nav-search-panel"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="search-modal-results">
                  {searchLoading && (
                    <div className="search-loading">
                      <span className="search-spinner" /> Searching...
                    </div>
                  )}

                  {!searchLoading && searchError && (
                    <div className="search-no-results">{searchError}</div>
                  )}

                  {!searchLoading && !searchError && searchResults && (() => {
                    const hasProducts = searchResults.products?.length > 0;
                    const hasServices = searchResults.services?.length > 0;
                    const hasProjects = searchResults.projects?.length > 0;
                    if (!hasProducts && !hasServices && !hasProjects) {
                      return <div className="search-no-results">No results found for "<strong>{searchQuery}</strong>"</div>;
                    }
                    return (
                      <>
                        {hasProducts && (
                          <div className="search-result-section">
                            <h4 className="search-section-title">Products</h4>
                            {searchResults.products.map((p) => (
                              <a key={p._id || p.id || p.name} href="/#products" className="search-result-item" onClick={(event) => handleSearchResultNavigation(event, "products")}>
                                <span className="search-result-name">{p.name}</span>
                                <span className="search-result-meta">{p.category}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        {hasServices && (
                          <div className="search-result-section">
                            <h4 className="search-section-title">Services</h4>
                            {searchResults.services.map((s) => (
                              <a key={s._id || s.id || s.title || s.name} href="/#services" className="search-result-item" onClick={(event) => handleSearchResultNavigation(event, "services")}>
                                <span className="search-result-name">{s.title || s.name}</span>
                                <span className="search-result-meta">{s.category}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        {hasProjects && (
                          <div className="search-result-section">
                            <h4 className="search-section-title">Projects</h4>
                            {searchResults.projects.map((p) => (
                              <a key={p._id || p.id || p.title || p.name} href="/#portfolio" className="search-result-item" onClick={(event) => handleSearchResultNavigation(event, "portfolio")}>
                                <span className="search-result-name">{p.title || p.name}</span>
                                <span className="search-result-meta">{p.category}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {!searchLoading && !searchResults && (
                    <div className="search-hint">
                      Start typing to search across products, services and projects...
                    </div>
                  )}
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </Motion.div>

        <div className="nav-actions">
          {/* Theme Toggle */}
          <Motion.div
            className="nav-theme-toggle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <ThemeToggle />
          </Motion.div>

          <Motion.button
            type="button"
            className={`nav-menu-toggle ${menuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation-sidebar"
          >
            <span className="menu-bars" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </Motion.button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <Motion.button
                type="button"
                className="nav-sidebar-backdrop"
                onClick={closeMenu}
                aria-label="Close menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <Motion.aside
                id="main-navigation-sidebar"
                className={`nav-sidebar ${userRole === "admin" ? "nav-sidebar-admin" : ""}`}
                initial={{ y: -12, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -12, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="nav-sidebar-header">
                  <div className="nav-sidebar-brand">
                    <img src="/images/logo.png" alt="SAPTech Uganda" />
                    <div>
                      <strong>SAPTech Uganda</strong>
                    </div>
                  </div>
                  <button type="button" className="nav-sidebar-close" onClick={closeMenu} aria-label="Close menu">x</button>
                </div>

                <nav className="nav-sidebar-links" aria-label="Main menu">
                  {NAV_ITEMS.map((link) => (
                    link.route ? (
                      <Link
                        key={link.id}
                        to={link.route}
                        onClick={prepareNavigation}
                        className={`nav-sidebar-link ${location.pathname === link.route ? "active" : ""}`}
                      >
                        <span>{link.label}</span>
                      </Link>
                    ) : (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        onClick={(event) => handleSectionNavigation(event, link.id)}
                        className={`nav-sidebar-link ${activeLink === link.id ? "active" : ""}`}
                      >
                        <span>{link.label}</span>
                      </a>
                    )
                  ))}

                  {userRole === "admin" && (
                    <div className="nav-sidebar-group">
                      <span className="nav-sidebar-label">Admin</span>
                      <button type="button" className="nav-sidebar-link nav-sidebar-button" onClick={() => handleMenuAction(onAdminOpen)}>
                        <span>Dashboard</span>
                      </button>
                      <button type="button" className="nav-sidebar-link nav-sidebar-button" onClick={() => handleMenuAction(onAdminOpen)}>
                        <span>Users</span>
                      </button>
                    </div>
                  )}

                  <div className="nav-sidebar-auth">
                    {!isAuthenticated ? (
                      <>
                        <button type="button" className="nav-sidebar-action login-action" onClick={() => handleMenuAction(() => onAuthModalOpen("login"))}>
                          Login
                        </button>
                        <button type="button" className="nav-sidebar-action signup-action" onClick={() => handleMenuAction(() => onAuthModalOpen("signup"))}>
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="nav-sidebar-action account-action" onClick={() => handleMenuAction(onAccountOpen)}>
                          <span className="account-profile">
                            {userProfilePic ? (
                              <img src={getImageUrl(userProfilePic)} alt={userName || "Profile"} className="profile-pic-small" />
                            ) : (
                              <span className="profile-icon" aria-hidden="true"></span>
                            )}
                            <span className="profile-name">{userName || "My Account"}</span>
                          </span>
                        </button>
                        {userRole === "admin" && (
                          <button type="button" className="nav-sidebar-action admin-action" onClick={() => handleMenuAction(onAdminOpen)}>
                            Admin
                          </button>
                        )}
                        <button type="button" className="nav-sidebar-action logout-action" onClick={() => handleMenuAction(onLogout)}>
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </nav>
              </Motion.aside>
            </>
          )}
        </AnimatePresence>
      </Motion.nav>

    </Motion.header>
  );
};

export default Header;

