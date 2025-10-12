/**
 * Product Controller
 * 
 * Manages product catalog and operations.
 * Features:
 * - Get all products with filtering (category, featured)
 * - Get product by ID with full details
 * - Create new products with image upload
 * - Update existing products
 * - Delete products and cleanup images
 * - Get product categories
 * - Handle product images and metadata
 * 
 * @module controllers/productController
 */

const { Product } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const { useCloudinary } = require("../config/fileUpload");

/**
 * Get the correct file path/URL for uploaded file
 * Works with both Cloudinary and local storage
 */
const getFileUrl = (file, folder = 'products') => {
    if (!file) return null;
    
    // If using Cloudinary, file.path contains the full Cloudinary URL
    if (useCloudinary && file.path && file.path.includes('cloudinary.com')) {
        return file.path;
    }
    
    // Local storage: construct path
    return `/uploads/${folder}/${file.filename}`;
};

/**
 * Product Controller Class
 * Handles product CRUD operations
 */
class ProductController {
    // =====================
    // PUBLIC ENDPOINTS
    // =====================

    // Get all active products (public endpoint)
    async getProducts(req, res, next) {
        try {
            const {
                category,
                featured,
                limit = 50,
                sort = "displayOrder"
            } = req.query;

            let query = { isActive: true };

            // Apply filters
            if (category && category !== "all") {
                query.category = category;
            }
            if (featured === "true") {
                query.isFeatured = true;
            }

            // Build sort object
            let sortObj = {};
            switch (sort) {
                case "name":
                    sortObj = { name: 1 };
                    break;
                case "category":
                    sortObj = { category: 1, displayOrder: 1 };
                    break;
                case "newest":
                    sortObj = { createdAt: -1 };
                    break;
                default:
                    sortObj = { displayOrder: 1, createdAt: -1 };
            }

            const products = await Product.find(query)
                .sort(sortObj)
                .limit(parseInt(limit))
                .select("-metadata");

            res.status(200).json({
                status: "success",
                data: {
                    products,
                    count: products.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single product by ID (public endpoint)
    async getProduct(req, res, next) {
        try {
            const { id } = req.params;
            
            const product = await Product.findOne({ 
                _id: id, 
                isActive: true 
            }).select("-metadata");

            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Product not found"
                });
            }

            // Increment views (fire and forget)
            product.incrementViews().catch(console.error);

            res.status(200).json({
                status: "success",
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get product categories (public endpoint)
    async getCategories(req, res, next) {
        try {
            const categories = await Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);

            res.status(200).json({
                status: "success",
                data: { categories }
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================
    // ADMIN ENDPOINTS
    // =====================

    // Get all products for admin (includes inactive)
    async getProductsAdmin(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
                search = "",
                category = "",
                status = "all"
            } = req.query;

            const skip = (page - 1) * limit;
            let query = {};

            // Apply search
            if (search.trim()) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { shortDescription: { $regex: search, $options: "i" } },
                    { technicalDescription: { $regex: search, $options: "i" } }
                ];
            }

            // Apply filters
            if (category && category !== "all" && category !== "") {
                query.category = category;
            }
            if (status && status !== "all" && status !== "") {
                query.isActive = status === "active";
            }

            const [products, totalProducts] = await Promise.all([
                Product.find(query)
                    .sort({ displayOrder: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Product.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalProducts / limit);

            res.status(200).json({
                status: "success",
                data: {
                    products,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalProducts,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new product (admin only)
    async createProduct(req, res, next) {
        try {
            console.log("🏷️ Creating product with data:", req.body);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log("❌ Validation errors:", errors.array());
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const productData = {
                ...req.body,
                image: getFileUrl(req.file, 'products')
            };

            // Parse JSON fields
            if (typeof productData.technicalSpecs === "string") {
                try {
                    productData.technicalSpecs = JSON.parse(productData.technicalSpecs);
                } catch (e) {
                    productData.technicalSpecs = [];
                }
            }

            if (typeof productData.features === "string") {
                try {
                    productData.features = JSON.parse(productData.features);
                } catch (e) {
                    productData.features = [];
                }
            }

            if (typeof productData.tags === "string") {
                try {
                    productData.tags = JSON.parse(productData.tags);
                } catch (e) {
                    productData.tags = [];
                }
            }

            if (typeof productData.price === "string") {
                try {
                    productData.price = JSON.parse(productData.price);
                } catch (e) {
                    productData.price = { type: "contact-for-price" };
                }
            }

            const product = await Product.create(productData);

            console.log("✅ Product created successfully:", product);

            res.status(201).json({
                status: "success",
                message: "Product created successfully",
                data: { product }
            });
        } catch (error) {
            console.error("❌ Error in createProduct:", error);
            if (error.code === 11000) {
                return res.status(400).json({
                    status: "error",
                    message: "Product with this name already exists"
                });
            }
            next(error);
        }
    }

    // Update product (admin only)
    async updateProduct(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const updateData = { ...req.body };

            // Handle file upload
            if (req.file) {
                updateData.image = getFileUrl(req.file, 'products');
                
                // Delete old image if it exists (only for local storage)
                if (!useCloudinary) {
                    const oldProduct = await Product.findById(id);
                    if (oldProduct && oldProduct.image && oldProduct.image.startsWith("/uploads/products/")) {
                        const oldImagePath = path.join(__dirname, "../..", oldProduct.image);
                        try {
                            await fs.unlink(oldImagePath);
                        } catch (error) {
                            console.log("Could not delete old image:", error.message);
                        }
                    }
                }
            }

            // Parse JSON fields
            ["technicalSpecs", "features", "tags", "price"].forEach(field => {
                if (typeof updateData[field] === "string") {
                    try {
                        updateData[field] = JSON.parse(updateData[field]);
                    } catch (e) {
                        if (field === "price") {
                            updateData[field] = { type: "contact-for-price" };
                        } else {
                            updateData[field] = [];
                        }
                    }
                }
            });

            const product = await Product.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Product not found"
                });
            }

            res.status(200).json({
                status: "success",
                message: "Product updated successfully",
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete product (admin only)
    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: "Product not found"
                });
            }

            // Delete associated image
            if (product.image && product.image.startsWith("/uploads/products/")) {
                const imagePath = path.join(__dirname, "../..", product.image);
                try {
                    await fs.unlink(imagePath);
                } catch (error) {
                    console.log("Could not delete product image:", error.message);
                }
            }

            await Product.findByIdAndDelete(id);

            res.status(200).json({
                status: "success",
                message: "Product deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Update product display order (admin only)
    async updateProductOrder(req, res, next) {
        try {
            const { products } = req.body; // Array of {id, displayOrder}

            if (!Array.isArray(products)) {
                return res.status(400).json({
                    status: "error",
                    message: "Products must be an array"
                });
            }

            // Update each product's display order
            const updatePromises = products.map(({ id, displayOrder }) =>
                Product.findByIdAndUpdate(id, { displayOrder })
            );

            await Promise.all(updatePromises);

            res.status(200).json({
                status: "success",
                message: "Product order updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Get product analytics (admin only)
    async getProductAnalytics(req, res, next) {
        try {
            const analytics = await Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: {
                            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                        },
                        featuredProducts: {
                            $sum: { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] }
                        },
                        totalViews: { $sum: "$metadata.views" },
                        totalInquiries: { $sum: "$metadata.inquiries" }
                    }
                }
            ]);

            const categoryStats = await Product.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                        views: { $sum: "$metadata.views" },
                        inquiries: { $sum: "$metadata.inquiries" }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            res.status(200).json({
                status: "success",
                data: {
                    overview: analytics[0] || {
                        totalProducts: 0,
                        activeProducts: 0,
                        featuredProducts: 0,
                        totalViews: 0,
                        totalInquiries: 0
                    },
                    categoryStats
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();