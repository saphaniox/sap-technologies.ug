/**
 * Product Form Component (Admin)
 * 
 * Comprehensive form for creating and editing products in the catalog.
 * 
 * Features:
 * - Create new products or edit existing ones
 * - Product information (name, descriptions, category)
 * - Price configuration (amount, currency, type)
 * - Image upload with preview
 * - Dynamic technical specifications array
 * - Dynamic features array
 * - Dynamic tags array
 * - Availability status
 * - Display order management
 * - Active/inactive toggle
 * - Featured product flag
 * - Form validation
 * - Loading states
 * - Success/error alerts
 * 
 * Categories:
 * - Electronics | Vehicles | Services | Spare Parts | Other
 * 
 * Price Types:
 * - fixed | negotiable | contact-for-price
 * 
 * Availability:
 * - in-stock | out-of-stock | pre-order | custom-order
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback to close modal
 * - product: Product object for edit mode (null for create)
 * - onSuccess: Callback after successful save
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/ProductForm.css";

const ProductForm = ({ isOpen, onClose, product, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        shortDescription: "",
        technicalDescription: "",
        category: "Other",
        price: {
            amount: "",
            currency: "USD",
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

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                shortDescription: product.shortDescription || "",
                technicalDescription: product.technicalDescription || "",
                category: product.category || "Other",
                price: {
                    amount: product.price?.amount || "",
                    currency: product.price?.currency || "USD",
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
            setImagePreview(product.image ? `${apiService.baseURL}${product.image}` : "");
        } else {
            // Reset form for new product
            setFormData({
                name: "",
                shortDescription: "",
                technicalDescription: "",
                category: "Other",
                price: {
                    amount: "",
                    currency: "USD",
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
            setImagePreview("");
        }
        setImage(null);
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
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

            // Add image if provided
            if (image) {
                submitData.append("productImage", image);
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
                await showAlert.success(
                    "Success!",
                    product ? "Product updated successfully!" : "Product created successfully!",
                    { 
                        showConfirmButton: true,
                        confirmButtonText: "Great!",
                        timer: 4000 // 4 seconds timer
                    }
                );
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Product form error:", error);
            await showAlert.error(
                "Error",
                error.message || "Failed to save product. Please try again.",
                {
                    showConfirmButton: true,
                    confirmButtonText: "OK",
                    timer: null // Don't auto-close errors
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
                                    <option value="IoT Devices">IoT Devices</option>
                                    <option value="Software Solutions">Software Solutions</option>
                                    <option value="Web Applications">Web Applications</option>
                                    <option value="Mobile Apps">Mobile Apps</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="AI/ML Products">AI/ML Products</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="availability">Availability</label>
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
                        <h3>Product Image</h3>
                        <div className="image-upload-section">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="image-input"
                            />
                            {imagePreview && (
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="form-section">
                        <h3>Technical Specifications</h3>
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
                        <h3>Features</h3>
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
                                <label htmlFor="displayOrder">Display Order</label>
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
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? "Saving..." : (product ? "Update Product" : "Create Product")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;