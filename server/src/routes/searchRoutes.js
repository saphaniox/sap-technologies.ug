/**
 * Search Routes
 * 
 * Provides public search endpoints for all content types.
 * All routes are rate-limited and support pagination.
 * 
 * @module routes/searchRoutes
 */

const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// =====================
// PUBLIC SEARCH ROUTES
// =====================

/**
 * Universal search across all models
 * GET /api/search?q=keyword&type=all&page=1&limit=20
 * 
 * Query Parameters:
 * - q: Search query (required, min 2 characters)
 * - type: Search type (all|products|services|projects|awards) - default: all
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 50)
 */
router.get("/", searchController.searchAll.bind(searchController));

/**
 * Search products with advanced filters
 * GET /api/search/products?q=keyword&category=IoT&minPrice=100&maxPrice=500
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - category: Product category filter
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - featured: Only featured products (true|false)
 * - sort: Sort order (relevance|price-asc|price-desc|popular|recent)
 * - page: Page number
 * - limit: Results per page
 */
router.get("/products", searchController.searchProductsEndpoint.bind(searchController));

/**
 * Search services
 * GET /api/search/services?q=keyword&category=Web Development
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - category: Service category filter
 * - featured: Only featured services (true|false)
 * - page: Page number
 * - limit: Results per page
 */
router.get("/services", searchController.searchServicesEndpoint.bind(searchController));

/**
 * Search projects
 * GET /api/search/projects?q=keyword&category=Web&status=completed
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - category: Project category filter
 * - status: Project status (completed|in-progress|planned)
 * - featured: Only featured projects (true|false)
 * - page: Page number
 * - limit: Results per page
 */
router.get("/projects", searchController.searchProjectsEndpoint.bind(searchController));

/**
 * Search award nominations
 * GET /api/search/awards?q=keyword&category=categoryId&status=approved
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - category: Award category ID filter
 * - status: Nomination status (pending|approved|rejected|winner|finalist)
 * - page: Page number
 * - limit: Results per page
 */
router.get("/awards", searchController.searchAwardsEndpoint.bind(searchController));

module.exports = router;
