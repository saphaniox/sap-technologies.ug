const { Product } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const { deleteFromCloudinary, extractPublicId } = require("../config/cloudinary");
const { getUploadedFileUrl } = require("../utils/uploadedFileUrl");

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

const parseJsonField = (value, fallback) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const normalizeStringArray = (value) => {
    const parsed = parseJsonField(value, value);
    const arrayValue = Array.isArray(parsed) ? parsed : [parsed];

    return arrayValue
        .map(item => String(item || "").trim())
        .filter(Boolean);
};

const normalizeTechnicalSpecs = (value) => {
    const parsed = parseJsonField(value, []);

    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .map(spec => ({
            name: String(spec?.name || "").trim(),
            value: String(spec?.value || "").trim()
        }))
        .filter(spec => spec.name && spec.value);
};

const normalizeNumber = (value, fallback = 0) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const normalizeBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return String(value).toLowerCase() === "true";
};

const normalizePrice = (value, fallback = { type: "contact-for-price" }) => {
    const parsed = parseJsonField(value, fallback);

    if (!parsed || typeof parsed !== "object") {
        return fallback;
    }

    return {
        amount: normalizeNumber(parsed.amount, null),
        currency: parsed.currency || "UGX",
        type: parsed.type || "contact-for-price"
    };
};

const deleteUploadedProductImage = async (imageUrl) => {
    if (!imageUrl) return;

    if (imageUrl.includes("cloudinary.com")) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
            await deleteFromCloudinary(publicId, "image");
        }
        return;
    }

    if (imageUrl.startsWith("/uploads/products/")) {
        const imgPath = path.join(__dirname, "../..", imageUrl);
        try {
            await fs.unlink(imgPath);
        } catch (error) {
            console.log("Could not delete old product image:", error.message);
        }
    }
};

// Helper to get file URL (Cloudinary or local)
const getFileUrl = (file, folder = 'products') => {
    return getUploadedFileUrl(file, folder);
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
            
            // Log file structure for debugging
            if (req.files && req.files.length > 0) {
                console.log('🔍 File objects structure:');
                req.files.forEach((file, idx) => {
                    console.log(`  File ${idx + 1}:`, {
                        filename: file.filename,
                        originalname: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        secure_url: file.secure_url ? 'present' : 'missing',
                        url: file.url ? 'present' : 'missing',
                        public_id: file.public_id ? 'present' : 'missing',
                        path: file.path ? file.path.substring(0, 50) : 'missing'
                    });
                });
            }
            
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
                productData.images = req.files.map((file, index) => {
                    const imageUrl = getFileUrl(file, 'products');
                    console.log(`📸 Generated URL for image ${index + 1}: ${imageUrl}`);
                    return {
                        url: imageUrl,
                        alt: productData.name || 'Product image',
                        isPrimary: index === 0,
                        order: index
                    };
                });
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

            productData.technicalSpecs = normalizeTechnicalSpecs(productData.technicalSpecs);
            productData.features = normalizeStringArray(productData.features);
            productData.tags = normalizeStringArray(productData.tags);
            productData.price = normalizePrice(productData.price);
            productData.displayOrder = normalizeNumber(productData.displayOrder, 0);
            productData.isActive = normalizeBoolean(productData.isActive, true);
            productData.isFeatured = normalizeBoolean(productData.isFeatured, false);

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
            if (Object.prototype.hasOwnProperty.call(updateData, "imagesToDelete")) {
                imagesToDelete = parseJsonField(updateData.imagesToDelete, []);
                if (!Array.isArray(imagesToDelete)) imagesToDelete = [];
                delete updateData.imagesToDelete;
            }

            // Handle legacy single-image deletion flag
            const deleteExistingImage = normalizeBoolean(updateData.deleteImage, false);
            delete updateData.deleteImage;

            if (deleteExistingImage) {
                const existingProduct = await Product.findById(id);
                if (existingProduct?.images?.length) {
                    imagesToDelete = existingProduct.images.map(img => img.url);
                }
            }

            // Get current product's images
            const existingProduct = await Product.findById(id);
            if (!existingProduct) {
                return res.status(404).json({
                    status: "error",
                    message: "Product not found"
                });
            }

            let currentImages = normalizeProductImages(
                existingProduct.images || [],
                existingProduct.name || updateData.name || "Product image"
            );

            // Remove images marked for deletion
            if (imagesToDelete.length > 0) {
                await Promise.all(imagesToDelete.map(deleteUploadedProductImage));
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

            if (updateData.technicalSpecs !== undefined) {
                updateData.technicalSpecs = normalizeTechnicalSpecs(updateData.technicalSpecs);
            }
            if (updateData.features !== undefined) {
                updateData.features = normalizeStringArray(updateData.features);
            }
            if (updateData.tags !== undefined) {
                updateData.tags = normalizeStringArray(updateData.tags);
            }
            if (updateData.price !== undefined) {
                updateData.price = normalizePrice(updateData.price, existingProduct.price);
            }
            if (updateData.displayOrder !== undefined) {
                updateData.displayOrder = normalizeNumber(updateData.displayOrder, existingProduct.displayOrder || 0);
            }
            if (updateData.isActive !== undefined) {
                updateData.isActive = normalizeBoolean(updateData.isActive, existingProduct.isActive);
            }
            if (updateData.isFeatured !== undefined) {
                updateData.isFeatured = normalizeBoolean(updateData.isFeatured, existingProduct.isFeatured);
            }

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

            const imageUrlsToDelete = [
                ...normalizeProductImages(product.images, product.name).map(image => image.url),
                product.image
            ].filter((url, index, urls) => url && urls.indexOf(url) === index);

            await Promise.all(imageUrlsToDelete.map(deleteUploadedProductImage));

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
