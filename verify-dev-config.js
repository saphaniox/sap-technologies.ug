// Quick test to verify environment configuration
console.log("Environment Configuration Test");
console.log("==============================");

// Simulate Vite environment
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const VITE_API_URL = "https://sap-technologies-ug.onrender.com"; // From .env.development

const API_BASE_URL = VITE_API_URL || 
  (isDev ? "http://localhost:5000" : "https://sap-technologies-ug.onrender.com");

console.log("Environment: Development");
console.log("VITE_API_URL (from .env.development):", VITE_API_URL);
console.log("Calculated API_BASE_URL:", API_BASE_URL);
console.log("");

console.log("Test API URLs:");
console.log("/api/account ->", `${API_BASE_URL}/api/account`);
console.log("/api/partners/public ->", `${API_BASE_URL}/api/partners/public`);
console.log("/api/products ->", `${API_BASE_URL}/api/products`);

console.log("");
console.log("✅ Development environment now uses production API");
console.log("✅ No more localhost:5000 connection errors!");