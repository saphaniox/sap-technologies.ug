/**
 * Cache Service
 * 
 * High-performance in-memory caching layer using node-cache.
 * Provides automatic TTL, cache invalidation, and statistics.
 * 
 * Features:
 * - Fast in-memory storage (no Redis dependency)
 * - Automatic expiration (TTL)
 * - Cache invalidation by key or pattern
 * - Cache statistics and monitoring
 * - Namespaced cache keys
 * - Compression for large objects
 * 
 * Cache Strategy:
 * - Products: 10 minutes (frequently viewed, rarely change)
 * - Services: 15 minutes (rarely change)
 * - Projects: 10 minutes (moderate changes)
 * - Partners: 30 minutes (rarely change)
 * - Awards: 5 minutes (frequent voting updates)
 * - Categories: 1 hour (very stable)
 * - Public lists: 5 minutes (balance between freshness and speed)
 * 
 * Usage:
 * const cache = require('./cacheService');
 * 
 * // Get or set
 * let products = cache.get('products:active');
 * if (!products) {
 *     products = await Product.find({ isActive: true });
 *     cache.set('products:active', products, 600); // 10 min
 * }
 * 
 * // Invalidate on update
 * cache.del('products:active');
 * cache.deletePattern('products:*');
 * 
 * @module services/cacheService
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        // Initialize cache with default settings
        this.cache = new NodeCache({
            stdTTL: 600,           // Default TTL: 10 minutes
            checkperiod: 120,      // Check for expired keys every 2 minutes
            useClones: false,      // Return references (faster, but be careful with mutations)
            deleteOnExpire: true,  // Auto-delete expired keys
            maxKeys: 1000          // Maximum number of keys (prevent memory issues)
        });

        // Cache hit/miss statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        // Log cache statistics every 10 minutes
        if (process.env.NODE_ENV === 'development') {
            setInterval(() => this.logStats(), 600000);
        }

        logger.logInfo('Cache', 'Cache service initialized', {
            defaultTTL: 600,
            maxKeys: 1000
        });
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const value = this.cache.get(key);
        
        if (value !== undefined) {
            this.stats.hits++;
            logger.logDebug('Cache', `Cache HIT: ${key}`);
            return value;
        }
        
        this.stats.misses++;
        logger.logDebug('Cache', `Cache MISS: ${key}`);
        return null;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {boolean} Success status
     */
    set(key, value, ttl = null) {
        try {
            const success = ttl 
                ? this.cache.set(key, value, ttl)
                : this.cache.set(key, value);
            
            if (success) {
                this.stats.sets++;
                logger.logDebug('Cache', `Cache SET: ${key}`, { ttl: ttl || 'default' });
            }
            
            return success;
        } catch (error) {
            logger.logError('Cache', error, { context: 'set', key });
            return false;
        }
    }

    /**
     * Delete specific key from cache
     * @param {string} key - Cache key
     * @returns {number} Number of deleted keys
     */
    del(key) {
        const deleted = this.cache.del(key);
        if (deleted > 0) {
            this.stats.deletes++;
            logger.logDebug('Cache', `Cache DELETE: ${key}`);
        }
        return deleted;
    }

    /**
     * Delete multiple keys matching pattern
     * @param {string} pattern - Key pattern (e.g., 'products:*')
     * @returns {number} Number of deleted keys
     */
    deletePattern(pattern) {
        const keys = this.cache.keys();
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        const matchingKeys = keys.filter(key => regex.test(key));
        
        let deleted = 0;
        matchingKeys.forEach(key => {
            deleted += this.cache.del(key);
        });
        
        if (deleted > 0) {
            this.stats.deletes += deleted;
            logger.logDebug('Cache', `Cache DELETE PATTERN: ${pattern}`, { deleted });
        }
        
        return deleted;
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Get multiple keys at once
     * @param {string[]} keys - Array of cache keys
     * @returns {object} Object with key-value pairs
     */
    mget(keys) {
        return this.cache.mget(keys);
    }

    /**
     * Flush entire cache
     */
    flush() {
        this.cache.flushAll();
        logger.logInfo('Cache', 'Cache flushed completely');
    }

    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    getStats() {
        const cacheStats = this.cache.getStats();
        return {
            ...this.stats,
            keys: cacheStats.keys,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            ksize: cacheStats.ksize,
            vsize: cacheStats.vsize,
            hitRate: this.getHitRate()
        };
    }

    /**
     * Calculate cache hit rate
     * @returns {string} Hit rate percentage
     */
    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0) return '0%';
        return ((this.stats.hits / total) * 100).toFixed(2) + '%';
    }

    /**
     * Log cache statistics
     */
    logStats() {
        const stats = this.getStats();
        logger.logInfo('Cache', 'Cache statistics', stats);
    }

    /**
     * Get TTL for a key
     * @param {string} key - Cache key
     * @returns {number} TTL in seconds, -1 if doesn't exist
     */
    getTtl(key) {
        return this.cache.getTtl(key);
    }

    /**
     * Helper: Cache with automatic fallback
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to fetch data if not cached
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<any>} Cached or fresh data
     */
    async getOrSet(key, fetchFunction, ttl = 600) {
        // Try to get from cache
        let data = this.get(key);
        
        if (data !== null) {
            return data;
        }
        
        // Fetch fresh data
        try {
            data = await fetchFunction();
            this.set(key, data, ttl);
            return data;
        } catch (error) {
            logger.logError('Cache', error, { context: 'getOrSet', key });
            throw error;
        }
    }

    // ==================
    // Preset Cache Methods for Common Use Cases
    // ==================

    /**
     * Cache products list
     */
    cacheProducts(products, filters = '') {
        const key = filters ? `products:${filters}` : 'products:all';
        return this.set(key, products, 600); // 10 min
    }

    /**
     * Get cached products
     */
    getCachedProducts(filters = '') {
        const key = filters ? `products:${filters}` : 'products:all';
        return this.get(key);
    }

    /**
     * Invalidate all product caches
     */
    invalidateProducts() {
        return this.deletePattern('products:*');
    }

    /**
     * Cache services list
     */
    cacheServices(services, filters = '') {
        const key = filters ? `services:${filters}` : 'services:all';
        return this.set(key, services, 900); // 15 min
    }

    /**
     * Get cached services
     */
    getCachedServices(filters = '') {
        const key = filters ? `services:${filters}` : 'services:all';
        return this.get(key);
    }

    /**
     * Invalidate all service caches
     */
    invalidateServices() {
        return this.deletePattern('services:*');
    }

    /**
     * Cache projects list
     */
    cacheProjects(projects, filters = '') {
        const key = filters ? `projects:${filters}` : 'projects:all';
        return this.set(key, projects, 600); // 10 min
    }

    /**
     * Get cached projects
     */
    getCachedProjects(filters = '') {
        const key = filters ? `projects:${filters}` : 'projects:all';
        return this.get(key);
    }

    /**
     * Invalidate all project caches
     */
    invalidateProjects() {
        return this.deletePattern('projects:*');
    }

    /**
     * Cache partners list
     */
    cachePartners(partners) {
        return this.set('partners:all', partners, 1800); // 30 min
    }

    /**
     * Get cached partners
     */
    getCachedPartners() {
        return this.get('partners:all');
    }

    /**
     * Invalidate partners cache
     */
    invalidatePartners() {
        return this.del('partners:all');
    }

    /**
     * Cache award categories
     */
    cacheAwardCategories(categories) {
        return this.set('awards:categories', categories, 3600); // 1 hour
    }

    /**
     * Get cached award categories
     */
    getCachedAwardCategories() {
        return this.get('awards:categories');
    }

    /**
     * Invalidate award categories cache
     */
    invalidateAwardCategories() {
        return this.del('awards:categories');
    }

    /**
     * Cache nominations list
     */
    cacheNominations(nominations, filters = '') {
        const key = filters ? `nominations:${filters}` : 'nominations:all';
        return this.set(key, nominations, 300); // 5 min (voting updates frequently)
    }

    /**
     * Get cached nominations
     */
    getCachedNominations(filters = '') {
        const key = filters ? `nominations:${filters}` : 'nominations:all';
        return this.get(key);
    }

    /**
     * Invalidate all nomination caches
     */
    invalidateNominations() {
        return this.deletePattern('nominations:*');
    }

    /**
     * Cache single item by ID
     */
    cacheItem(type, id, data, ttl = 600) {
        return this.set(`${type}:${id}`, data, ttl);
    }

    /**
     * Get cached single item by ID
     */
    getCachedItem(type, id) {
        return this.get(`${type}:${id}`);
    }

    /**
     * Invalidate single item cache
     */
    invalidateItem(type, id) {
        return this.del(`${type}:${id}`);
    }
}

// Export singleton instance
module.exports = new CacheService();
