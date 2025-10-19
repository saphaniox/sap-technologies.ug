const { Product } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const { useCloudinary } = require("../config/fileUpload");

// Helper to get file URL (Cloudinary or local)
const getFileUrl = (file, folder = 'products') => {
    if (!file) return null;
    
    if (useCloudinary && file.path && file.path.includes('cloudinary.com')) {
        return file.path;
    }
    
    return `/uploads/${folder}/${file.filename}`;
};

class ProductController {
    async getProducts(req, res, next) {
        try {
            const {
                category,
                featured,
                limit = 50,
                sort = "displayOrder"
            } = req.query;

            let query = { isActive: true };

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
            console.log("📁 File uploaded:", req.file ? {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                path: req.file.path
            } : "No file");
            
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
                image: req.file ? getFileUrl(req.file, 'products') : null
            };

            console.log("📸 Image URL set to:", productData.image);

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
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    status: "error",
                    message: "Product with this name already exists"
                });
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }));
                
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: validationErrors
                });
            }
            
            next(error);
        }
    }

    // Update product (admin only)
    async updateProduct(req, res, next) {
        try {
            console.log("🔄 Updating product:", req.params.id);
            console.log("📁 File uploaded:", req.file ? {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            } : "No new file");
            
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
                console.log("📸 New image URL:", updateData.image);
                
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
            ).catch(validationError => {
                console.error("❌ Mongoose validation error:", validationError);
                console.error("❌ Validation errors:", validationError.errors);
                throw validationError;
            });

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
            console.error("❌ Error in updateProduct:", error);
            
            // Handle validation errors specifically
            if (error.name === 'ValidationError') {
                console.log("🔍 Validation error details:", error.errors);
                
                const validationErrors = Object.values(error.errors).map(err => {
                    console.log("🔍 Processing error:", { path: err.path, message: err.message, kind: err.kind });
                    return {
                        field: err.path,
                        message: err.message,
                        kind: err.kind,
                        value: err.value
                    };
                });
                
                console.log("🔍 Formatted validation errors:", validationErrors);
                
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: validationErrors
                });
            }
            
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