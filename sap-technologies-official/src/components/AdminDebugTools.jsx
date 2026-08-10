import React, { useState } from 'react';
import { showAlert, Swal } from '../utils/alerts.jsx';
import apiService from '../services/api';

const AdminDebugTools = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState('');

    // Basic button test
    const testButtonClick = () => {
        console.log('🔘 Button click test triggered!');
        setResults('🔘 Button Click Test: WORKING - Handlers are functioning correctly');
    };

    // Direct SweetAlert test
    const testDirectSwal = async () => {
        try {
            console.log('🧪 Testing Direct SweetAlert import...');
            console.log('Swal object:', Swal);
            console.log('Swal.fire function:', typeof Swal.fire);
            
            const result = await Swal.fire({
                title: 'Direct SweetAlert Test',
                text: 'This is a direct SweetAlert test!',
                icon: 'success',
                showConfirmButton: true,
                confirmButtonText: 'OK',
                timer: 4000
            });
            
            console.log('✅ Direct SweetAlert test completed, result:', result);
            setResults('✅ Direct SweetAlert Test: PASSED');
            
        } catch (error) {
            console.error('❌ Direct SweetAlert test failed:', error);
            setResults(`❌ Direct SweetAlert Test: FAILED - ${error.message}`);
        }
    };

    // SweetAlert Tests
    const testSweetAlert = async () => {
        try {
            console.log('🧪 Testing SweetAlert...');
            console.log('showAlert object:', showAlert);
            console.log('showAlert.success function:', typeof showAlert.success);
            
            const result = await showAlert.success(
                "Test Alert", 
                "This is a test SweetAlert notification!",
                { 
                    showConfirmButton: true,
                    confirmButtonText: "Great!",
                    timer: 4000 
                }
            );
            
            console.log('✅ SweetAlert test completed, result:', result);
            setResults('✅ Success Alert Test: PASSED');
            
        } catch (error) {
            console.error('❌ SweetAlert test failed:', error);
            setResults(`❌ Success Alert Test: FAILED - ${error.message}`);
        }
    };

    const testErrorAlert = async () => {
        try {
            console.log('🧪 Testing Error Alert...');
            
            const result = await showAlert.error(
                "Test Error",
                "This is a test error alert!",
                {
                    showConfirmButton: true,
                    confirmButtonText: "OK"
                }
            );
            
            console.log('✅ Error alert test completed, result:', result);
            setResults('✅ Error Alert Test: PASSED');
            
        } catch (error) {
            console.error('❌ Error alert test failed:', error);
            setResults(`❌ Error Alert Test: FAILED - ${error.message}`);
        }
    };

    const testWarningAlert = async () => {
        try {
            console.log('🧪 Testing Warning Alert...');
            
            const result = await showAlert.warning(
                "Test Warning",
                "This is a test warning alert!",
                {
                    showConfirmButton: true,
                    confirmButtonText: "Understood"
                }
            );
            
            console.log('✅ Warning alert test completed, result:', result);
            setResults('✅ Warning Alert Test: PASSED');
            
        } catch (error) {
            console.error('❌ Warning alert test failed:', error);
            setResults(`❌ Warning Alert Test: FAILED - ${error.message}`);
        };
    };

    // API Tests
    const testProductsAPI = async () => {
        setLoading(true);
        setResults('Testing Products API...');
        
        try {
            console.log('🧪 Testing Products API...');
            
            // Test public products API
            const publicProducts = await apiService.getProducts();
            console.log('Public products response:', publicProducts);
            
            // Test admin products API
            const adminProducts = await apiService.getProductsAdmin({ page: 1, limit: 10 });
            console.log('Admin products response:', adminProducts);
            
            setResults(`
✅ Products API Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Public Products: ${publicProducts?.data?.products?.length || 0} found
Admin Products: ${adminProducts?.data?.products?.length || 0} found

Public Sample: ${publicProducts?.data?.products?.[0]?.name || 'None'}
Admin Sample: ${adminProducts?.data?.products?.[0]?.name || 'None'}

Categories Found: ${publicProducts?.data?.products ? [...new Set(publicProducts.data.products.map(p => p.category))].join(', ') : 'None'}
            `);
            
        } catch (error) {
            console.error('API test error:', error);
            setResults(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testAuthAPI = async () => {
        setLoading(true);
        setResults('Testing Authentication API...');
        
        try {
            console.log('🧪 Testing Auth API...');
            
            // Test auth status
            const authStatus = await apiService.checkAuthStatus();
            console.log('Auth status response:', authStatus);
            
            setResults(`
✅ Authentication API Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authenticated: ${authStatus?.isAuthenticated ? 'Yes' : 'No'}
User: ${authStatus?.user?.name || 'None'}
Role: ${authStatus?.user?.role || 'None'}
Email: ${authStatus?.user?.email || 'None'}
            `);
            
        } catch (error) {
            console.error('Auth API test error:', error);
            setResults(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testProductCreation = async () => {
        setLoading(true);
        setResults('Testing product creation...');
        
        try {
            console.log('🧪 Testing Product Creation...');
            
            const testData = new FormData();
            testData.append('name', 'DEBUG Test Product ' + Date.now());
            testData.append('shortDescription', 'This is a debug test product - safe to delete');
            testData.append('technicalDescription', 'Created by admin debug tools for testing purposes');
            testData.append('category', 'Electronics');
            testData.append('availability', 'in-stock');
            testData.append('displayOrder', '999');
            testData.append('isActive', 'true');
            testData.append('isFeatured', 'false');
            testData.append('price', JSON.stringify({ amount: null, currency: 'USD', type: 'contact-for-price' }));
            testData.append('technicalSpecs', JSON.stringify([{ name: 'Test Spec', value: 'Debug Value' }]));
            testData.append('features', JSON.stringify(['Debug Feature 1', 'Debug Feature 2']));
            testData.append('tags', JSON.stringify(['debug', 'test']));
            
            const response = await apiService.createProduct(testData);
            console.log('Create product response:', response);
            
            if (response.status === 'success') {
                await showAlert.success(
                    "Success!",
                    "Debug test product created successfully! You can delete it from the Products section.",
                    { 
                        showConfirmButton: true,
                        confirmButtonText: "Great!",
                        timer: 6000 
                    }
                );
                setResults('✅ Product creation successful! Check the Products section to see the new debug product.');
            } else {
                setResults(`❌ Product creation failed: ${JSON.stringify(response)}`);
            }
            
        } catch (error) {
            console.error('Product creation test error:', error);
            setResults(`❌ Error: ${error.message}`);
            await showAlert.error(
                "Error",
                `Product creation failed: ${error.message}`,
                {
                    showConfirmButton: true,
                    confirmButtonText: "OK"
                }
            );
        } finally {
            setLoading(false);
        }
    };

    // Email Service Tests
    const testContactEmail = async () => {
        setLoading(true);
        setResults('Testing contact email service...');
        
        try {
            console.log('🧪 Testing Contact Email...');
            
            const testContact = {
                name: 'Debug Test User',
                email: 'debugtest@example.com',
                message: 'This is a debug test contact submission. Safe to ignore.'
            };
            
            const response = await apiService.submitContact(testContact);
            console.log('Contact email response:', response);
            
            setResults(`
✅ Contact Email Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${response.status === 'success' ? '✅ Success' : '❌ Failed'}
Message: ${response.message || 'No message'}
Contact ID: ${response.data?.contact?._id || 'N/A'}

Note: Check your email inbox for the notification.
            `);
            
        } catch (error) {
            console.error('Contact email test error:', error);
            setResults(`❌ Contact Email Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testNewsletterEmail = async () => {
        setLoading(true);
        setResults('Testing newsletter email service...');
        
        try {
            console.log('🧪 Testing Newsletter Email...');
            
            const testEmail = `debugtest${Date.now()}@example.com`;
            const response = await apiService.subscribeNewsletter({ email: testEmail });
            console.log('Newsletter email response:', response);
            
            setResults(`
✅ Newsletter Email Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${response.status === 'success' ? '✅ Success' : '❌ Failed'}
Message: ${response.message || 'No message'}
Test Email: ${testEmail}

Note: Check email service logs for confirmation.
            `);
            
        } catch (error) {
            console.error('Newsletter email test error:', error);
            setResults(`❌ Newsletter Email Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Image/Upload Tests
    const testImageService = async () => {
        setLoading(true);
        setResults('Testing image service...');
        
        try {
            console.log('🧪 Testing Image Service...');
            
            // Test getting products with images
            const products = await apiService.getProducts();
            const productsWithImages = products?.data?.products?.filter(p => p.image) || [];
            
            setResults(`
🖼️ Image Service Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Products: ${products?.data?.products?.length || 0}
Products with Images: ${productsWithImages.length}
Image URLs Working: ${productsWithImages.length > 0 ? '✅ Yes' : '⚠️ No images found'}

Sample Image URL:
${productsWithImages[0]?.image || 'No image available'}

Note: Check browser console for image loading errors.
            `);
            
        } catch (error) {
            console.error('Image service test error:', error);
            setResults(`❌ Image Service Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testCloudinaryConnection = async () => {
        setLoading(true);
        setResults('Testing Cloudinary connection...');
        
        try {
            console.log('🧪 Testing Cloudinary Connection...');
            
            // Test by loading products and checking image URLs
            const products = await apiService.getProducts();
            const hasCloudinaryImages = products?.data?.products?.some(p => 
                p.image && p.image.includes('cloudinary.com')
            );
            
            setResults(`
☁️ Cloudinary Connection Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cloudinary Images Found: ${hasCloudinaryImages ? '✅ Yes' : '⚠️ No'}
Image Service: ${hasCloudinaryImages ? 'Cloudinary Active' : 'Local/Other'}

Status: ${hasCloudinaryImages ? '✅ Connected' : '⚠️ Not using Cloudinary'}

Note: Check environment variables for Cloudinary configuration.
            `);
            
        } catch (error) {
            console.error('Cloudinary test error:', error);
            setResults(`❌ Cloudinary Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Session/Cookie Tests
    const testSessionStorage = async () => {
        setLoading(true);
        setResults('Testing session storage...');
        
        try {
            console.log('🧪 Testing Session Storage...');
            
            // Test session storage
            const testKey = 'debug_test_' + Date.now();
            const testValue = { test: true, timestamp: Date.now() };
            
            sessionStorage.setItem(testKey, JSON.stringify(testValue));
            const retrieved = JSON.parse(sessionStorage.getItem(testKey));
            sessionStorage.removeItem(testKey);
            
            // Test local storage
            localStorage.setItem(testKey, JSON.stringify(testValue));
            const retrievedLocal = JSON.parse(localStorage.getItem(testKey));
            localStorage.removeItem(testKey);
            
            setResults(`
🍪 Storage Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session Storage: ${retrieved && retrieved.test ? '✅ Working' : '❌ Failed'}
Local Storage: ${retrievedLocal && retrievedLocal.test ? '✅ Working' : '❌ Failed'}

Session Keys: ${sessionStorage.length}
Local Keys: ${localStorage.length}

Status: ${retrieved && retrievedLocal ? '✅ All storage working' : '❌ Storage issues detected'}
            `);
            
        } catch (error) {
            console.error('Session storage test error:', error);
            setResults(`❌ Storage Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testCookies = async () => {
        setLoading(true);
        setResults('Testing cookies...');
        
        try {
            console.log('🧪 Testing Cookies...');
            
            // Test setting and getting cookies
            const testCookieName = 'debug_test_' + Date.now();
            document.cookie = `${testCookieName}=test_value; path=/`;
            
            const cookieExists = document.cookie.includes(testCookieName);
            
            // Clean up
            document.cookie = `${testCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            
            // Check for auth cookies
            const hasAuthCookie = document.cookie.includes('accessToken') || 
                                 document.cookie.includes('refreshToken') ||
                                 document.cookie.includes('connect.sid');
            
            setResults(`
🍪 Cookie Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cookie Support: ${cookieExists ? '✅ Enabled' : '❌ Disabled'}
Auth Cookies Present: ${hasAuthCookie ? '✅ Yes' : '⚠️ No'}

Total Cookies: ${document.cookie.split(';').filter(c => c.trim()).length}

Status: ${cookieExists ? '✅ Cookies working' : '❌ Cookies blocked'}

Note: Check browser cookie settings if blocked.
            `);
            
        } catch (error) {
            console.error('Cookie test error:', error);
            setResults(`❌ Cookie Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Service/Project Tests
    const testServicesAPI = async () => {
        setLoading(true);
        setResults('Testing services API...');
        
        try {
            console.log('🧪 Testing Services API...');
            
            const services = await apiService.getAllServices();
            const categories = await apiService.getServiceCategories();
            
            console.log('Services response:', services);
            console.log('Categories response:', categories);
            
            setResults(`
🛠️ Services API Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Services: ${services?.data?.services?.length || 0}
Categories Available: ${categories?.data?.categories?.length || 0}

Sample Service: ${services?.data?.services?.[0]?.name || 'None'}
Sample Category: ${categories?.data?.categories?.[0] || 'None'}

Status: ${services?.data?.services?.length > 0 ? '✅ API Working' : '⚠️ No services found'}
            `);
            
        } catch (error) {
            console.error('Services API test error:', error);
            setResults(`❌ Services API Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testProjectsAPI = async () => {
        setLoading(true);
        setResults('Testing projects API...');
        
        try {
            console.log('🧪 Testing Projects API...');
            
            const projects = await apiService.getAllProjects();
            const categories = await apiService.getProjectCategories();
            
            console.log('Projects response:', projects);
            console.log('Categories response:', categories);
            
            setResults(`
🚀 Projects API Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Projects: ${projects?.data?.projects?.length || 0}
Categories Available: ${categories?.data?.categories?.length || 0}

Sample Project: ${projects?.data?.projects?.[0]?.name || 'None'}
Sample Category: ${categories?.data?.categories?.[0] || 'None'}

Status: ${projects?.data?.projects?.length > 0 ? '✅ API Working' : '⚠️ No projects found'}
            `);
            
        } catch (error) {
            console.error('Projects API test error:', error);
            setResults(`❌ Projects API Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Newsletter/Contact Tests
    const testInquiryForms = async () => {
        setLoading(true);
        setResults('Testing inquiry forms...');
        
        try {
            console.log('🧪 Testing Inquiry Forms...');
            
            // Get a product to test with
            const products = await apiService.getProducts();
            const testProduct = products?.data?.products?.[0];
            
            if (!testProduct) {
                setResults('⚠️ No products available to test product inquiry.');
                return;
            }
            
            const testInquiry = {
                productId: testProduct._id,
                customerEmail: 'debugtest@example.com',
                customerPhone: '+256700000000',
                message: 'Debug test inquiry - safe to ignore'
            };
            
            const response = await apiService.submitProductInquiry(testInquiry);
            console.log('Inquiry response:', response);
            
            setResults(`
📬 Inquiry Form Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${response.success ? '✅ Success' : '❌ Failed'}
Message: ${response.message || 'No message'}
Product Tested: ${testProduct.name}

Inquiry ID: ${response.data?.inquiryId || 'N/A'}

Status: ${response.success ? '✅ Inquiry forms working' : '❌ Inquiry submission failed'}
            `);
            
        } catch (error) {
            console.error('Inquiry forms test error:', error);
            setResults(`❌ Inquiry Forms Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testPartnershipRequest = async () => {
        setLoading(true);
        setResults('Testing partnership request...');
        
        try {
            console.log('🧪 Testing Partnership Request...');
            
            const testRequest = {
                companyName: 'Debug Test Company ' + Date.now(),
                contactEmail: 'debugtest@example.com',
                contactPerson: 'Debug Test User',
                website: 'https://example.com',
                description: 'This is a debug test partnership request. Safe to delete.'
            };
            
            const response = await apiService.submitPartnershipRequest(testRequest);
            console.log('Partnership request response:', response);
            
            setResults(`
🤝 Partnership Request Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${response.status === 'success' ? '✅ Success' : '❌ Failed'}
Message: ${response.message || 'No message'}

Request ID: ${response.data?.partnershipRequest?.id || 'N/A'}

Status: ${response.status === 'success' ? '✅ Partnership requests working' : '❌ Request submission failed'}

Note: Check Partnership Requests section in admin dashboard.
            `);
            
        } catch (error) {
            console.error('Partnership request test error:', error);
            setResults(`❌ Partnership Request Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Security Tests
    const testRateLimiting = async () => {
        setLoading(true);
        setResults('Testing rate limiting...');
        
        try {
            console.log('🧪 Testing Rate Limiting...');
            
            const startTime = Date.now();
            const requests = [];
            
            // Make 10 rapid requests
            for (let i = 0; i < 10; i++) {
                requests.push(
                    apiService.getProducts().catch(e => ({ error: e.message }))
                );
            }
            
            const results = await Promise.allSettled(requests);
            const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
            const failed = results.length - successful;
            const duration = Date.now() - startTime;
            
            setResults(`
🔒 Rate Limiting Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Requests: 10
Successful: ${successful}
Failed/Blocked: ${failed}
Duration: ${duration}ms

Rate Limiting: ${failed > 0 ? '✅ Active' : '⚠️ Not detected'}

Status: ${failed > 0 ? '✅ Rate limiting working' : '⚠️ All requests passed'}

Note: Rate limiting may vary by endpoint.
            `);
            
        } catch (error) {
            console.error('Rate limiting test error:', error);
            setResults(`❌ Rate Limiting Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testAdminAuth = async () => {
        setLoading(true);
        setResults('Testing admin authorization...');
        
        try {
            console.log('🧪 Testing Admin Authorization...');
            
            // Test auth status
            const authStatus = await apiService.checkAuthStatus();
            
            // Try to access admin endpoint
            let adminAccessWorking = false;
            try {
                const adminProducts = await apiService.getProductsAdmin({ page: 1, limit: 1 });
                adminAccessWorking = adminProducts?.status === 'success';
            } catch (e) {
                adminAccessWorking = false;
            }
            
            setResults(`
🔒 Admin Authorization Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authenticated: ${authStatus?.isAuthenticated ? '✅ Yes' : '❌ No'}
User Role: ${authStatus?.user?.role || 'None'}
Is Admin: ${authStatus?.user?.role === 'admin' || authStatus?.user?.role === 'superadmin' ? '✅ Yes' : '❌ No'}

Admin Endpoint Access: ${adminAccessWorking ? '✅ Working' : '❌ Blocked'}

Status: ${adminAccessWorking ? '✅ Admin authorization working' : '❌ Authorization issues detected'}

User: ${authStatus?.user?.name || 'Not logged in'}
Email: ${authStatus?.user?.email || 'N/A'}
            `);
            
        } catch (error) {
            console.error('Admin auth test error:', error);
            setResults(`❌ Admin Auth Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Cache Tests
    const testCachePerformance = async () => {
        setLoading(true);
        setResults('Testing cache performance...');
        
        try {
            console.log('🧪 Testing Cache Performance...');
            
            // First request (should populate cache)
            const start1 = performance.now();
            await apiService.getProducts();
            const firstLoadTime = (performance.now() - start1).toFixed(2);
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Second request (should hit cache)
            const start2 = performance.now();
            await apiService.getProducts();
            const cachedLoadTime = (performance.now() - start2).toFixed(2);
            
            const improvement = ((firstLoadTime - cachedLoadTime) / firstLoadTime * 100).toFixed(1);
            const isCached = cachedLoadTime < firstLoadTime * 0.5; // If 50% faster, likely cached
            
            setResults(`
⚡ Cache Performance Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First Load: ${firstLoadTime}ms
Cached Load: ${cachedLoadTime}ms
Improvement: ${improvement}%

Cache Status: ${isCached ? '✅ Likely Active' : '⚠️ Not detected'}

Status: ${isCached ? '✅ Caching working' : '⚠️ No significant caching detected'}

Note: Results may vary. Run multiple times for accuracy.
            `);
            
        } catch (error) {
            console.error('Cache test error:', error);
            setResults(`❌ Cache Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Database Tests
    const testDatabaseConnection = async () => {
        setLoading(true);
        setResults('Testing database connection...');
        
        try {
            console.log('🧪 Testing Database Connection...');
            
            // Test multiple endpoints to verify database connectivity
            const tests = await Promise.allSettled([
                apiService.getProducts(),
                apiService.getAllServices(),
                apiService.getAllProjects()
            ]);
            
            const results = tests.map((test, index) => {
                const endpoints = ['Products', 'Services', 'Projects'];
                return `${endpoints[index]}: ${test.status === 'fulfilled' ? '✅ Connected' : '❌ Failed'}`;
            });
            
            setResults(`
🔍 Database Connection Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${results.join('\n')}

Overall Status: ${tests.every(t => t.status === 'fulfilled') ? '✅ All connections successful' : '⚠️ Some connections failed'}
            `);
            
        } catch (error) {
            console.error('Database test error:', error);
            setResults(`❌ Database test error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Performance Tests
    const testAPIPerformance = async () => {
        setLoading(true);
        setResults('Testing API performance...');
        
        try {
            console.log('🧪 Testing API Performance...');
            
            const startTime = performance.now();
            
            // Test multiple API calls
            const [products, services, projects] = await Promise.all([
                apiService.getProducts(),
                apiService.getAllServices(),
                apiService.getAllProjects()
            ]);
            
            const endTime = performance.now();
            const totalTime = (endTime - startTime).toFixed(2);
            
            setResults(`
⚡ API Performance Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Time: ${totalTime}ms
Products: ${products?.data?.products?.length || 0} items
Services: ${services?.data?.services?.length || 0} items
Projects: ${projects?.data?.projects?.length || 0} items

Performance: ${totalTime < 1000 ? '✅ Excellent' : totalTime < 2000 ? '⚠️ Good' : '❌ Needs Improvement'}
            `);
            
        } catch (error) {
            console.error('Performance test error:', error);
            setResults(`❌ Performance test error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Clear debug console logs
    const clearDebugLogs = () => {
        console.clear();
        setResults('Console cleared! Debug logs reset.');
        showAlert.info('Debug Console', 'Console logs have been cleared.', { timer: 2000 });
    };

    // Export debug info
    const exportDebugInfo = async () => {
        try {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                authStatus: await apiService.checkAuthStatus(),
                apiTests: {
                    products: await apiService.getProducts().catch(e => ({ error: e.message })),
                    services: await apiService.getAllServices().catch(e => ({ error: e.message })),
                    projects: await apiService.getAllProjects().catch(e => ({ error: e.message }))
                }
            };
            
            const dataStr = JSON.stringify(debugInfo, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `debug-info-${Date.now()}.json`;
            link.click();
            
            showAlert.success('Export Complete', 'Debug information has been downloaded.', { timer: 3000 });
        } catch (error) {
            console.error('Export error:', error);
            showAlert.error('Export Failed', `Could not export debug info: ${error.message}`);
        }
    };

    const buttonStyle = {
        margin: '3px',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500'
    };

    return (
        <div style={{ 
            background: 'white', 
            border: '1px solid #ddd', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '100%'
        }}>
            <h4 style={{ marginBottom: '15px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔧 Admin Debug Tools
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                    - Testing & Diagnostics
                </span>
            </h4>
            
            {/* Alert Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🚨 Alert System Tests</h5>
                <button onClick={testButtonClick} style={{ ...buttonStyle, background: '#9ca3af', color: 'white' }}>
                    Test Button Click
                </button>
                <button onClick={testDirectSwal} style={{ ...buttonStyle, background: '#6366f1', color: 'white' }}>
                    Test Direct SweetAlert
                </button>
                <button onClick={testSweetAlert} style={{ ...buttonStyle, background: '#3b82f6', color: 'white' }}>
                    Test Success Alert
                </button>
                <button onClick={testErrorAlert} style={{ ...buttonStyle, background: '#ef4444', color: 'white' }}>
                    Test Error Alert
                </button>
                <button onClick={testWarningAlert} style={{ ...buttonStyle, background: '#f59e0b', color: 'white' }}>
                    Test Warning Alert
                </button>
            </div>

            {/* API Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🔌 API & Database Tests</h5>
                <button onClick={testProductsAPI} disabled={loading} style={{ ...buttonStyle, background: '#10b981', color: 'white' }}>
                    Test Products API
                </button>
                <button onClick={testAuthAPI} disabled={loading} style={{ ...buttonStyle, background: '#8b5cf6', color: 'white' }}>
                    Test Authentication
                </button>
                <button onClick={testDatabaseConnection} disabled={loading} style={{ ...buttonStyle, background: '#06b6d4', color: 'white' }}>
                    Test Database
                </button>
                <button onClick={testAPIPerformance} disabled={loading} style={{ ...buttonStyle, background: '#84cc16', color: 'white' }}>
                    Test Performance
                </button>
            </div>

            {/* CRUD Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>⚙️ CRUD Operation Tests</h5>
                <button onClick={testProductCreation} disabled={loading} style={{ ...buttonStyle, background: '#f59e0b', color: 'white' }}>
                    Test Product Creation
                </button>
            </div>

            {/* Email Service Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>📧 Email Service Tests</h5>
                <button onClick={testContactEmail} disabled={loading} style={{ ...buttonStyle, background: '#14b8a6', color: 'white' }}>
                    Test Contact Email
                </button>
                <button onClick={testNewsletterEmail} disabled={loading} style={{ ...buttonStyle, background: '#06b6d4', color: 'white' }}>
                    Test Newsletter Email
                </button>
            </div>

            {/* Image/Upload Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🖼️ Image & Upload Tests</h5>
                <button onClick={testImageService} disabled={loading} style={{ ...buttonStyle, background: '#8b5cf6', color: 'white' }}>
                    Test Image Service
                </button>
                <button onClick={testCloudinaryConnection} disabled={loading} style={{ ...buttonStyle, background: '#7c3aed', color: 'white' }}>
                    Test Cloudinary
                </button>
            </div>

            {/* Session/Cookie Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🍪 Session & Storage Tests</h5>
                <button onClick={testSessionStorage} disabled={loading} style={{ ...buttonStyle, background: '#ec4899', color: 'white' }}>
                    Test Storage
                </button>
                <button onClick={testCookies} disabled={loading} style={{ ...buttonStyle, background: '#db2777', color: 'white' }}>
                    Test Cookies
                </button>
            </div>

            {/* Service/Project Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🛠️ Services & Projects Tests</h5>
                <button onClick={testServicesAPI} disabled={loading} style={{ ...buttonStyle, background: '#0ea5e9', color: 'white' }}>
                    Test Services API
                </button>
                <button onClick={testProjectsAPI} disabled={loading} style={{ ...buttonStyle, background: '#0284c7', color: 'white' }}>
                    Test Projects API
                </button>
            </div>

            {/* Form Submission Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>📬 Form Submission Tests</h5>
                <button onClick={testInquiryForms} disabled={loading} style={{ ...buttonStyle, background: '#f97316', color: 'white' }}>
                    Test Inquiry Forms
                </button>
                <button onClick={testPartnershipRequest} disabled={loading} style={{ ...buttonStyle, background: '#ea580c', color: 'white' }}>
                    Test Partnership Request
                </button>
            </div>

            {/* Security Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🔒 Security Tests</h5>
                <button onClick={testRateLimiting} disabled={loading} style={{ ...buttonStyle, background: '#dc2626', color: 'white' }}>
                    Test Rate Limiting
                </button>
                <button onClick={testAdminAuth} disabled={loading} style={{ ...buttonStyle, background: '#b91c1c', color: 'white' }}>
                    Test Admin Auth
                </button>
            </div>

            {/* Cache Tests */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>⚡ Cache & Performance Tests</h5>
                <button onClick={testCachePerformance} disabled={loading} style={{ ...buttonStyle, background: '#65a30d', color: 'white' }}>
                    Test Cache Performance
                </button>
            </div>

            {/* Utility Functions */}
            <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: '#555', marginBottom: '8px', fontSize: '14px' }}>🛠️ Debug Utilities</h5>
                <button onClick={clearDebugLogs} style={{ ...buttonStyle, background: '#6b7280', color: 'white' }}>
                    Clear Console
                </button>
                <button onClick={exportDebugInfo} style={{ ...buttonStyle, background: '#7c3aed', color: 'white' }}>
                    Export Debug Info
                </button>
            </div>
            
            {/* Results Display */}
            {results && (
                <div style={{ 
                    marginTop: '15px',
                    padding: '12px', 
                    background: '#f8f9fa', 
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                        📊 Test Results:
                    </div>
                    {results}
                </div>
            )}
            
            {loading && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '8px 12px',
                    background: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: '4px',
                    color: '#1976d2',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div className="spinner" style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #e3f2fd',
                        borderTop: '2px solid #2196f3',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Running tests...
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AdminDebugTools;
