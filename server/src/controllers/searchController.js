const { Product, Service, Project } = require("../models");
const { Nomination } = require("../models/Award");
const logger = require("../utils/logger");

class SearchController {
    /**
     * Search across all models
     * GET /api/search?q=keyword&type=all&page=1&limit=20
     */
    async searchAll(req, res, next) {
        try {
            const { q, type = 'all', page = 1, limit = 20 } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Search query must be at least 2 characters"
                });
            }

            const searchQuery = q.trim();
            logger.logDebug('Search', 'Searching all models', { query: searchQuery, type });

            const results = {};
            
            // Search based on type parameter
            if (type === 'all' || type === 'products') {
                results.products = await this.searchProducts(searchQuery, { limit: parseInt(limit) });
            }
            
            if (type === 'all' || type === 'services') {
                results.services = await this.searchServices(searchQuery, { limit: parseInt(limit) });
            }
            
            if (type === 'all' || type === 'projects') {
                results.projects = await this.searchProjects(searchQuery, { limit: parseInt(limit) });
            }
            
            if (type === 'all' || type === 'awards') {
                results.awards = await this.searchAwards(searchQuery, { limit: parseInt(limit) });
            }

            // Count total results
            const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

            res.json({
                success: true,
                query: searchQuery,
                totalResults,
                results
            });

        } catch (error) {
            logger.logError('Search', error, { context: 'searchAll' });
            next(error);
        }
    }

    /**
     * Search products with advanced filtering
     * GET /api/search/products?q=keyword&category=IoT&minPrice=100&maxPrice=500&page=1&limit=20
     */
    async searchProductsEndpoint(req, res, next) {
        try {
            const { 
                q, 
                category, 
                minPrice, 
                maxPrice, 
                featured,
                page = 1, 
                limit = 20,
                sort = 'relevance'
            } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Search query must be at least 2 characters"
                });
            }

            const searchQuery = q.trim();
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Build query
            const query = {
                isActive: true,
                $text: { $search: searchQuery }
            };

            // Add filters
            if (category) query.category = category;
            if (featured === 'true') query.isFeatured = true;
            
            if (minPrice || maxPrice) {
                query['price.amount'] = {};
                if (minPrice) query['price.amount'].$gte = Number(minPrice);
                if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
            }

            // Build sort
            let sortOptions = {};
            switch (sort) {
                case 'price-asc':
                    sortOptions = { 'price.amount': 1 };
                    break;
                case 'price-desc':
                    sortOptions = { 'price.amount': -1 };
                    break;
                case 'popular':
                    sortOptions = { 'metadata.views': -1 };
                    break;
                case 'recent':
                    sortOptions = { createdAt: -1 };
                    break;
                default: // relevance
                    sortOptions = { score: { $meta: "textScore" } };
                    query.score = { $meta: "textScore" };
            }

            // Execute search with pagination
            const [products, total] = await Promise.all([
                Product.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Product.countDocuments(query)
            ]);

            logger.logInfo('Search', 'Products search completed', { 
                query: searchQuery, 
                results: products.length,
                filters: { category, minPrice, maxPrice, featured }
            });

            res.json({
                success: true,
                query: searchQuery,
                results: products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    category,
                    minPrice,
                    maxPrice,
                    featured: featured === 'true'
                }
            });

        } catch (error) {
            logger.logError('Search', error, { context: 'searchProductsEndpoint' });
            next(error);
        }
    }

    /**
     * Search services
     * GET /api/search/services?q=keyword&category=Web Development&page=1&limit=20
     */
    async searchServicesEndpoint(req, res, next) {
        try {
            const { q, category, featured, page = 1, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Search query must be at least 2 characters"
                });
            }

            const searchQuery = q.trim();
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const query = {
                status: 'active',
                $text: { $search: searchQuery }
            };

            if (category) query.category = category;
            if (featured === 'true') query.featured = true;

            const [services, total] = await Promise.all([
                Service.find(query)
                    .sort({ score: { $meta: "textScore" } })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Service.countDocuments(query)
            ]);

            logger.logInfo('Search', 'Services search completed', { query: searchQuery, results: services.length });

            res.json({
                success: true,
                query: searchQuery,
                results: services,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            logger.logError('Search', error, { context: 'searchServicesEndpoint' });
            next(error);
        }
    }

    /**
     * Search projects
     * GET /api/search/projects?q=keyword&category=Web&status=completed&page=1&limit=20
     */
    async searchProjectsEndpoint(req, res, next) {
        try {
            const { q, category, status, featured, page = 1, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Search query must be at least 2 characters"
                });
            }

            const searchQuery = q.trim();
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const query = {
                visibility: 'public',
                $text: { $search: searchQuery }
            };

            if (category) query.category = category;
            if (status) query.status = status;
            if (featured === 'true') query.featured = true;

            const [projects, total] = await Promise.all([
                Project.find(query)
                    .sort({ score: { $meta: "textScore" } })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Project.countDocuments(query)
            ]);

            logger.logInfo('Search', 'Projects search completed', { query: searchQuery, results: projects.length });

            res.json({
                success: true,
                query: searchQuery,
                results: projects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            logger.logError('Search', error, { context: 'searchProjectsEndpoint' });
            next(error);
        }
    }

    /**
     * Search award nominations
     * GET /api/search/awards?q=keyword&category=categoryId&status=approved&page=1&limit=20
     */
    async searchAwardsEndpoint(req, res, next) {
        try {
            const { q, category, status, page = 1, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Search query must be at least 2 characters"
                });
            }

            const searchQuery = q.trim();
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const query = {
                $text: { $search: searchQuery }
            };

            if (category) query.category = category;
            if (status) query.status = status;
            else query.status = { $in: ['approved', 'winner', 'finalist'] }; // Only show approved by default

            const [nominations, total] = await Promise.all([
                Nomination.find(query)
                    .populate('category', 'name icon')
                    .sort({ score: { $meta: "textScore" }, votes: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Nomination.countDocuments(query)
            ]);

            logger.logInfo('Search', 'Awards search completed', { query: searchQuery, results: nominations.length });

            res.json({
                success: true,
                query: searchQuery,
                results: nominations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            logger.logError('Search', error, { context: 'searchAwardsEndpoint' });
            next(error);
        }
    }

    // ==================
    // Helper Methods
    // ==================

    async searchProducts(query, options = {}) {
        const limit = options.limit || 10;
        try {
            return await Product.find({
                isActive: true,
                $text: { $search: query }
            })
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select('name shortDescription image category price isFeatured')
            .lean();
        } catch (error) {
            logger.logError('Search', error, { context: 'searchProducts helper' });
            return [];
        }
    }

    async searchServices(query, options = {}) {
        const limit = options.limit || 10;
        try {
            return await Service.find({
                status: 'active',
                $text: { $search: query }
            })
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select('title description icon category featured')
            .lean();
        } catch (error) {
            logger.logError('Search', error, { context: 'searchServices helper' });
            return [];
        }
    }

    async searchProjects(query, options = {}) {
        const limit = options.limit || 10;
        try {
            return await Project.find({
                visibility: 'public',
                $text: { $search: query }
            })
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select('title shortDescription images category status featured')
            .lean();
        } catch (error) {
            logger.logError('Search', error, { context: 'searchProjects helper' });
            return [];
        }
    }

    async searchAwards(query, options = {}) {
        const limit = options.limit || 10;
        try {
            return await Nomination.find({
                status: { $in: ['approved', 'winner', 'finalist'] },
                $text: { $search: query }
            })
            .populate('category', 'name icon')
            .sort({ score: { $meta: "textScore" }, votes: -1 })
            .limit(limit)
            .select('nomineeName nomineeTitle nomineePhoto category votes status')
            .lean();
        } catch (error) {
            logger.logError('Search', error, { context: 'searchAwards helper' });
            return [];
        }
    }
}

module.exports = new SearchController();
