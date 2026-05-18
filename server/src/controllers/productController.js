const { Product } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const { useCloudinary } = require("../config/fileUpload");
const { cloudinary } = require("../config/cloudinary");

// Normalize legacy image shapes (string URLs) to schema-compliant objects.
const normalizeProductImages = (images, fallbackAlt = "Product image") => {
    if (!Array.isArray(images)) return [];

    return images
        .map((img, index) => {
            if (!img) return null;

            if (typeof img === "string") {
                return {
                    url: img,
                    alt: fallbackAlt,
                    isPrimary: index === 0,
                    order: index
                };
            }

            if (typeof img === "object" && img.url) {
                return {
                    url: img.url,
                    alt: img.alt || fallbackAlt,
                    isPrimary: typeof img.isPrimary === "boolean" ? img.isPrimary : index === 0,
                    order: Number.isFinite(img.order) ? img.order : index
                };
            }

            return null;
        })
        .filter(Boolean);
};

// Helper to get file URL (Cloudinary or local)
const getFileUrl = (file, folder = 'products') => {
    if (!file) return null;
    
    const cloudinaryPath = file.path || file.filename;
    if (useCloudinary && cloudinaryPath) {
        if (cloudinaryPath.includes('cloudinary.com')) {
            return cloudinaryPath;
        }

        return cloudinary.url(cloudinaryPath, {
            secure: true,
            resource_type: 'image',
            type: 'upload'
        });
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

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "error",
                    message: errors.array()[0].msg
                });
            }
            
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
            console.log("📁 Files uploaded:", req.files ? req.files.length : "No files");
            
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
                ...req.body
            };

            // Handle multiple image uploads
            if (req.files && req.files.length > 0) {
                productData.images = req.files.map((file, index) => ({
                    url: getFileUrl(file, 'products'),
                    alt: productData.name || 'Product image',
                    isPrimary: index === 0,
                    order: index
                }));
                productData.image = productData.images[0].url; // Backward compatibility
                console.log("📸 Images uploaded:", productData.images.length);
            } else if (req.file) {
                // Support single file upload for backward compatibility
                productData.image = getFileUrl(req.file, 'products');
                productData.images = [{
                    url: productData.image,
                    alt: productData.name || 'Product image',
                    isPrimary: true,
                    order: 0
                }];
            }

            console.log("📸 Image(s) set:", productData.images ? productData.images.length : 'none');

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
            console.log("📁 Files uploaded:", req.files ? req.files.length : "No new files");
            
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

            // Parse imagesToDelete from the form
            let imagesToDelete = [];
            if (updateData.imagesToDelete) {
                try {
                    imagesToDelete = JSON.parse(updateData.imagesToDelete);
                    delete updateData.imagesToDelete;
                } catch (e) {
                    imagesToDelete = [];
                }
            }

            // Handle legacy single-image deletion flag
            if (updateData.deleteImage === 'true') {
                const existingProduct = await Product.findById(id);
                if (existingProduct?.images?.length) {
                    imagesToDelete = existingProduct.images.map(img => img.url);
                }
                delete updateData.deleteImage;
            }

            // Get current product's images
            const existingProduct = await Product.findById(id);
            let currentImages = normalizeProductImages(
                existingProduct?.images || [],
                existingProduct?.name || updateData.name || "Product image"
            );

            // Remove images marked for deletion
            if (imagesToDelete.length > 0) {
                // Delete local files if not on Cloudinary
                if (!useCloudinary) {
                    for (const imgUrl of imagesToDelete) {
                        if (imgUrl && imgUrl.startsWith("/uploads/products/")) {
                            const imgPath = path.join(__dirname, "../..", imgUrl);
                            try { await fs.unlink(imgPath); } catch (e) {
                                console.log("Could not delete old image:", e.message);
                            }
                        }
                    }
                }
                currentImages = currentImages.filter(img => !imagesToDelete.includes(img.url));
                console.log("🗑️ Images after deletion:", currentImages.length);
            }

            // Handle multiple file uploads — append to remaining existing images
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file, index) => ({
                    url: getFileUrl(file, 'products'),
                    alt: updateData.name || 'Product image',
                    isPrimary: currentImages.length === 0 && index === 0,
                    order: currentImages.length + index
                }));
                updateData.images = [...currentImages, ...newImages];
                updateData.images = normalizeProductImages(updateData.images, updateData.name || existingProduct?.name || 'Product image')
                    .map((img, index) => ({
                        ...img,
                        isPrimary: index === 0,
                        order: index
                    }));
                updateData.image = updateData.images[0]?.url || null;
                console.log("📸 New images uploaded:", newImages.length, "| Total:", updateData.images.length);
            } else if (req.file) {
                // Backward-compatible single file upload
                const newImage = {
                    url: getFileUrl(req.file, 'products'),
                    alt: updateData.name || 'Product image',
                    isPrimary: currentImages.length === 0,
                    order: currentImages.length
                };
                updateData.images = [...currentImages, newImage];
                updateData.images = normalizeProductImages(updateData.images, updateData.name || existingProduct?.name || 'Product image')
                    .map((img, index) => ({
                        ...img,
                        isPrimary: index === 0,
                        order: index
                    }));
                updateData.image = updateData.images[0]?.url || null;
                console.log("📸 New image URL:", newImage.url);
            } else if (imagesToDelete.length > 0) {
                // No new uploads but some were deleted — persist filtered list
                updateData.images = normalizeProductImages(currentImages, updateData.name || existingProduct?.name || 'Product image')
                    .map((img, index) => ({
                        ...img,
                        isPrimary: index === 0,
                        order: index
                    }));
                updateData.image = currentImages.length > 0 ? currentImages[0].url : null;
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
