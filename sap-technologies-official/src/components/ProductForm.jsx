import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import { compressImageFiles, removeConnectedBackgroundToWhite } from "../utils/mediaCompression";
import "../styles/ProductForm.css";
import "../styles/ProductFormToggle.css";

const DEFAULT_PRODUCT_CATEGORY = "IoT Devices";

const ProductForm = ({ isOpen, onClose, product, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        shortDescription: "",
        technicalDescription: "",
        category: DEFAULT_PRODUCT_CATEGORY,
        price: {
            amount: "",
            currency: "UGX",
            type: "contact-for-price"
        },
        availability: "custom-order",
        displayOrder: 0,
        isActive: true,
        isFeatured: false,
        technicalSpecs: [{ name: "", value: "" }],
        features: [""],
        tags: [""]
    });

    const [loading, setLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [imageProcessing, setImageProcessing] = useState(false);
    const [removeBackground, setRemoveBackground] = useState(true);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                shortDescription: product.shortDescription || "",
                technicalDescription: product.technicalDescription || "",
                category: product.category || DEFAULT_PRODUCT_CATEGORY,
                price: {
                    amount: product.price?.amount || "",
                    currency: product.price?.currency || "UGX",
                    type: product.price?.type || "contact-for-price"
                },
                availability: product.availability || "custom-order",
                displayOrder: product.displayOrder || 0,
                isActive: product.isActive !== undefined ? product.isActive : true,
                isFeatured: product.isFeatured !== undefined ? product.isFeatured : false,
                technicalSpecs: product.technicalSpecs?.length > 0 ? product.technicalSpecs : [{ name: "", value: "" }],
                features: product.features?.length > 0 ? product.features : [""],
                tags: product.tags?.length > 0 ? product.tags : [""]
            });
            
            // Handle images - support both single image (old) and array (new)
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const imageUrls = product.images.map(img => ({
                    url: getImageUrl(typeof img === 'string' ? img : img.url),
                    path: typeof img === 'string' ? img : img.url,
                    isExisting: true
                }));
                setImagePreviews(imageUrls);
            } else if (product.image) {
                // Legacy single image support
                setImagePreviews([{
                    url: getImageUrl(product.image),
                    path: product.image,
                    isExisting: true
                }]);
            } else {
                setImagePreviews([]);
            }
            setImagesToDelete([]);
            setNewImageFiles([]);
        } else {
            // Reset form for new product
            setFormData({
                name: "",
                shortDescription: "",
                technicalDescription: "",
                category: DEFAULT_PRODUCT_CATEGORY,
                price: {
                    amount: "",
                    currency: "UGX",
                    type: "contact-for-price"
                },
                availability: "custom-order",
                displayOrder: 0,
                isActive: true,
                isFeatured: false,
                technicalSpecs: [{ name: "", value: "" }],
                features: [""],
                tags: [""]
            });
            setImagePreviews([]);
            setImagesToDelete([]);
            setNewImageFiles([]);
        }
    }, [product]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes("price.")) {
            const priceField = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                price: {
                    ...prev.price,
                    [priceField]: priceField === "amount" ? parseFloat(value) || 0 : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value
            }));
        }
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        const maxImages = 5;
        
        // Check if adding these files would exceed the limit
        const totalImages = imagePreviews.length + files.length;
        if (totalImages > maxImages) {
            showAlert.error(
                "Too many images",
                `You can upload up to ${maxImages} images. You currently have ${imagePreviews.length} — please remove some before adding more.`,
                {
                    showConfirmButton: true,
                    confirmButtonText: "OK"
                }
            );
            e.target.value = '';
            return;
        }

        if (files.length > 0) {
            setImageProcessing(true);

            // Validate each file
            for (const file of files) {
                // Validate original file size before browser-side optimization
                const maxSize = 25 * 1024 * 1024; // 25MB in bytes
                if (file.size > maxSize) {
                    showAlert.error(
                        "Image too large",
                        `"${file.name}" is over the 25MB browser optimization limit. Please use a smaller image.`,
                        {
                            showConfirmButton: true,
                            confirmButtonText: "OK"
                        }
                    );
                    e.target.value = '';
                    setImageProcessing(false);
                    return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showAlert.error(
                        "Wrong file type",
                        `"${file.name}" isn't an image file. Please only upload image files.`,
                        {
                            showConfirmButton: true,
                            confirmButtonText: "OK"
                        }
                    );
                    e.target.value = '';
                    setImageProcessing(false);
                    return;
                }
            }

            let optimizedFiles;
            try {
                // Only remove background if the toggle is enabled
                const processedFiles = removeBackground 
                    ? await Promise.all(files.map((file) => removeConnectedBackgroundToWhite(file)))
                    : files;

                optimizedFiles = await compressImageFiles(processedFiles, {
                    maxWidth: 1400,
                    maxHeight: 1400,
                    quality: 0.82
                });
            } catch (error) {
                showAlert.error(
                    "Couldn't prepare image",
                    error.message || "Please try another image.",
                    {
                        showConfirmButton: true,
                        confirmButtonText: "OK"
                    }
                );
                e.target.value = '';
                setImageProcessing(false);
                return;
            }

            for (const file of optimizedFiles) {
                if (file.size > 10 * 1024 * 1024) {
                    showAlert.error(
                        "Image too large",
                        `"${file.name}" is still over the 10MB upload limit after optimization.`,
                        {
                            showConfirmButton: true,
                            confirmButtonText: "OK"
                        }
                    );
                    e.target.value = '';
                    setImageProcessing(false);
                    return;
                }
            }

            // Add new files to existing array
            setNewImageFiles(prev => [...prev, ...optimizedFiles]);
            
            // Generate previews for new images
            optimizedFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews(prev => [...prev, {
                        url: e.target.result,
                        file: file,
                        isExisting: false
                    }]);
                };
                reader.onerror = () => {
                    showAlert.error(
                        "Couldn't read that file",
                        `We had trouble reading "${file.name}". Please try again.`,
                        {
                            showConfirmButton: true,
                            confirmButtonText: "OK"
                        }
                    );
                };
                reader.readAsDataURL(file);
            });
        }
        
        // Reset file input
        e.target.value = '';
        setImageProcessing(false);
    };

    const handleRemoveImage = (index) => {
        const imageToRemove = imagePreviews[index];
        
        if (imageToRemove.isExisting) {
            // Mark existing image for deletion
            setImagesToDelete(prev => [...prev, imageToRemove.path]);
        } else {
            // Remove from new files array
            const fileIndex = newImageFiles.findIndex(f => f === imageToRemove.file);
            if (fileIndex !== -1) {
                setNewImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
            }
        }
        
        // Remove from previews
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleTechnicalSpecChange = (index, field, value) => {
        const newSpecs = [...formData.technicalSpecs];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        setFormData(prev => ({ ...prev, technicalSpecs: newSpecs }));
    };

    const addTechnicalSpec = () => {
        setFormData(prev => ({
            ...prev,
            technicalSpecs: [...prev.technicalSpecs, { name: "", value: "" }]
        }));
    };

    const removeTechnicalSpec = (index) => {
        if (formData.technicalSpecs.length > 1) {
            const newSpecs = formData.technicalSpecs.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, technicalSpecs: newSpecs }));
        }
    };

    const handleArrayFieldChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const removeArrayField = (field, index) => {
        if (formData[field].length > 1) {
            const newArray = formData[field].filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, [field]: newArray }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            
            // Add basic fields
            submitData.append("name", formData.name);
            submitData.append("shortDescription", formData.shortDescription);
            submitData.append("technicalDescription", formData.technicalDescription);
            submitData.append("category", formData.category);
            submitData.append("availability", formData.availability);
            submitData.append("displayOrder", formData.displayOrder);
            submitData.append("isActive", formData.isActive);
            submitData.append("isFeatured", formData.isFeatured);

            // Add price as JSON
            submitData.append("price", JSON.stringify(formData.price));

            // Add arrays as JSON
            submitData.append("technicalSpecs", JSON.stringify(
                formData.technicalSpecs.filter(spec => spec.name.trim() && spec.value.trim())
            ));
            submitData.append("features", JSON.stringify(
                formData.features.filter(feature => feature.trim())
            ));
            submitData.append("tags", JSON.stringify(
                formData.tags.filter(tag => tag.trim())
            ));

            // Add new image files
            newImageFiles.forEach(file => {
                submitData.append("images", file);
            });
            
            // Add images to delete
            if (imagesToDelete.length > 0) {
                submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
            }

            let response;
            if (product) {
                // Update existing product
                response = await apiService.updateProduct(product._id, submitData);
            } else {
                // Create new product
                response = await apiService.createProduct(submitData);
            }

            if (response.status === "success") {
                const savedProduct = response.data?.product || null;
                if (onSuccess) onSuccess(savedProduct);
                onClose();

                await showAlert.success(
                    "Saved! 🎉",
                    product ? "Product updated successfully." : "Product added successfully!",
                    { 
                        showConfirmButton: true,
                        confirmButtonText: "Great!",
                        timer: 4000
                    }
                );
            }
        } catch (error) {
            console.error("❌ Product form error:", error);
            console.error("❌ Error response data:", error.response?.data);
            console.error("❌ Error response errors array:", error.response?.data?.errors);
            
            // Handle validation errors with field details
let errorMessage = error.message || "Something went wrong saving the product. Please try again.";
            
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                // Format validation errors nicely
                const validationErrors = error.response.data.errors
                    .map(err => {
                        // Handle different error structures
                        const field = err.field || err.path || 'unknown';
                        const message = err.message || err.msg || JSON.stringify(err);
                        return `• ${field}: ${message}`;
                    })
                    .join('\n');
                errorMessage = `Validation failed:\n\n${validationErrors}`;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            await showAlert.error(
                "Couldn't save the product",
                errorMessage,
                {
                    showConfirmButton: true,
                    confirmButtonText: "OK",
                    timer: null
                }
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay product-form-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{product ? "Edit Product" : "Add New Product"}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="product-form">
                    {/* Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="name">Product Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                maxLength="100"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="shortDescription">Short Description *</label>
                            <textarea
                                id="shortDescription"
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                                required
                                maxLength="200"
                                rows="2"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="technicalDescription">Technical Description *</label>
                            <textarea
                                id="technicalDescription"
                                name="technicalDescription"
                                value={formData.technicalDescription}
                                onChange={handleInputChange}
                                required
                                maxLength="1000"
                                rows="4"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <optgroup label="Software & Digital">
                                        <option value="Software Solutions">Software Solutions</option>
                                        <option value="Web Applications">Web Applications</option>
                                        <option value="Mobile Apps">Mobile Apps</option>
                                        <option value="Desktop Applications">Desktop Applications</option>
                                        <option value="Enterprise Software">Enterprise Software</option>
                                        <option value="SaaS Products">SaaS Products</option>
                                    </optgroup>
                                    
                                    <optgroup label="Hardware & Electronics">
                                        <option value="IoT Devices">IoT Devices</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Electricals">Electricals</option>
                                        <option value="Networking Equipment">Networking Equipment</option>
                                        <option value="Computer Hardware">Computer Hardware</option>
                                        <option value="Smart Home Devices">Smart Home Devices</option>
                                    </optgroup>
                                    
                                    <optgroup label="Emerging Tech">
                                        <option value="AI/ML Products">AI/ML Products</option>
                                        <option value="Automation Solutions">Automation Solutions</option>
                                        <option value="Robotics">Robotics</option>
                                        <option value="Blockchain Solutions">Blockchain Solutions</option>
                                        <option value="Cloud Services">Cloud Services</option>
                                    </optgroup>
                                    
                                    <optgroup label="Industry Specific">
                                        <option value="Security Solutions">Security Solutions</option>
                                        <option value="POS Systems">POS Systems</option>
                                        <option value="Medical Devices">Medical Devices</option>
                                        <option value="Agricultural Tech">Agricultural Tech</option>
                                        <option value="Educational Tech">Educational Tech</option>
                                        <option value="Financial Tech">Financial Tech</option>
                                    </optgroup>
                                    
                                    <optgroup label="General">
                                        <option value="Accessories">Accessories</option>
                                        <option value="Components">Components</option>
                                        <option value="Tools & Equipment">Tools & Equipment</option>
                                        <option value="Other">Other</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="availability">Availability <span className="optional">(optional)</span></label>
                                <select
                                    id="availability"
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleInputChange}
                                >
                                    <option value="in-stock">In Stock</option>
                                    <option value="pre-order">Pre-Order</option>
                                    <option value="custom-order">Custom Order</option>
                                    <option value="discontinued">Discontinued</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="form-section">
                        <h3>Product Images (Max 5) <span className="optional">(optional)</span></h3>
                        <div className="image-upload-section">
                            <div className="background-removal-toggle">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={removeBackground}
                                        onChange={(e) => setRemoveBackground(e.target.checked)}
                                    />
                                    <span className="toggle-text">
                                        {removeBackground ? '✓ Remove Background (White)' : '✗ Keep Original Background'}
                                    </span>
                                </label>
                                <small className="toggle-help">
                                    {removeBackground 
                                        ? 'Images will be cleaned onto a white background automatically'
                                        : 'Images will keep their original background'}
                                </small>
                            </div>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="image-input"
                                id="productImage"
                                style={{ display: 'none' }}
                                disabled={imageProcessing}
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('productImage').click()}
                                className="btn-add-image"
                                title="Add images"
                                disabled={imagePreviews.length >= 5 || imageProcessing}
                            >
                                <i className="fas fa-plus"></i> {imageProcessing ? "Preparing Images..." : `Add Images (${imagePreviews.length}/5)`}
                            </button>
                            
                            {/* Image Previews Grid */}
                            {imagePreviews.length > 0 && (
                                <div className="image-previews-grid">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="image-preview-item">
                                            <img src={preview.url} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="btn-remove-image"
                                                title="Remove image"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                            <div className="image-label">
                                                {preview.isExisting ? 'Existing' : 'New'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price Configuration */}
                    <div className="form-section">
                        <h3>Price Configuration</h3>
                        
                        <div className="form-group">
                            <label htmlFor="price.type">Price Type *</label>
                            <select
                                id="price.type"
                                name="price.type"
                                value={formData.price.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="fixed">Fixed Price</option>
                                <option value="negotiable">Negotiable</option>
                                <option value="contact-for-price">Contact for Price</option>
                            </select>
                            <small className="form-help">Choose how pricing works for this product</small>
                        </div>

                        {(formData.price.type === "fixed" || formData.price.type === "negotiable") && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="price.amount">
                                        {formData.price.type === "fixed" ? "Price Amount *" : <>Starting Price <span className="optional">(optional)</span></>}
                                    </label>
                                    <input
                                        type="number"
                                        id="price.amount"
                                        name="price.amount"
                                        value={formData.price.amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        required={formData.price.type === "fixed"}
                                        placeholder="Enter price amount"
                                    />
                                    <small className="form-help">
                                        {formData.price.type === "fixed" 
                                            ? "Exact selling price" 
                                            : "Base price for negotiations"}
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price.currency">Currency *</label>
                                    <select
                                        id="price.currency"
                                        name="price.currency"
                                        value={formData.price.currency}
                                        onChange={handleInputChange}
                                        required={formData.price.type === "fixed" || formData.price.type === "negotiable"}
                                    >
                                        <option value="">Select Currency</option>
                                        <optgroup label="Popular Currencies">
                                            <option value="UGX">🇺🇬 UGX - Ugandan Shilling</option>
                                            <option value="USD">🇺🇸 USD - US Dollar</option>
                                            <option value="EUR">🇪🇺 EUR - Euro</option>
                                            <option value="GBP">🇬🇧 GBP - British Pound</option>
                                        </optgroup>
                                        <optgroup label="African Currencies">
                                            <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                                            <option value="TZS">🇹🇿 TZS - Tanzanian Shilling</option>
                                            <option value="RWF">🇷🇼 RWF - Rwandan Franc</option>
                                            <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                                            <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                                            <option value="GHS">🇬🇭 GHS - Ghanaian Cedi</option>
                                        </optgroup>
                                        <optgroup label="Other Currencies">
                                            <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                                            <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                                            <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                                            <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                                            <option value="INR">🇮🇳 INR - Indian Rupee</option>
                                            <option value="AED">🇦🇪 AED - UAE Dirham</option>
                                            <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                                        </optgroup>
                                    </select>
                                    <small className="form-help">Select the currency for the price</small>
                                </div>
                            </div>
                        )}

                        {formData.price.type === "contact-for-price" && (
                            <div className="info-box">
                                <p>ℹ️ Users will need to contact you for pricing information. No price will be displayed on the website.</p>
                            </div>
                        )}
                    </div>

                    {/* Technical Specifications */}
                    <div className="form-section">
                        <h3>Technical Specifications <span className="optional">(optional)</span></h3>
                        {formData.technicalSpecs.map((spec, index) => (
                            <div key={index} className="spec-row">
                                <input
                                    type="text"
                                    placeholder="Specification name"
                                    value={spec.name}
                                    onChange={(e) => handleTechnicalSpecChange(index, "name", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={spec.value}
                                    onChange={(e) => handleTechnicalSpecChange(index, "value", e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTechnicalSpec(index)}
                                    className="remove-btn"
                                    disabled={formData.technicalSpecs.length === 1}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addTechnicalSpec} className="add-btn">
                            Add Specification
                        </button>
                    </div>

                    {/* Features */}
                    <div className="form-section">
                        <h3>Features <span className="optional">(optional)</span></h3>
                        {formData.features.map((feature, index) => (
                            <div key={index} className="array-row">
                                <input
                                    type="text"
                                    placeholder="Feature description"
                                    value={feature}
                                    onChange={(e) => handleArrayFieldChange("features", index, e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeArrayField("features", index)}
                                    className="remove-btn"
                                    disabled={formData.features.length === 1}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addArrayField("features")} className="add-btn">
                            Add Feature
                        </button>
                    </div>

                    {/* Settings */}
                    <div className="form-section">
                        <h3>Settings</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="displayOrder">Display Order <span className="optional">(optional)</span></label>
                                <input
                                    type="number"
                                    id="displayOrder"
                                    name="displayOrder"
                                    value={formData.displayOrder}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <span>Active (visible to users)</span>
                            </label>
                            
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={handleInputChange}
                                />
                                <span>Featured (highlighted on homepage)</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || imageProcessing} className="btn btn-primary">
                            {imageProcessing ? "Preparing Images..." : loading ? "Saving..." : (product ? "Update Product" : "Create Product")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
