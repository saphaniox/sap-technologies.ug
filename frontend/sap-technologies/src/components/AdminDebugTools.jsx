/**
 * Admin Debug Tools Component
 * 
 * Development and testing tool for admins to diagnose issues
 * and test system functionality.
 * 
 * Features:
 * - Button click handler testing
 * - SweetAlert/alert system testing
 * - API endpoint testing
 * - Database connection verification
 * - Email service testing
 * - Authentication system checks
 * - Results display console
 * - Error logging and reporting
 * 
 * Test Categories:
 * - UI/UX Tests (button clicks, alerts, modals)
 * - Backend Tests (API calls, database queries)
 * - Service Tests (email, WhatsApp, certificates)
 * - Authentication Tests (login, sessions, tokens)
 * 
 * Usage:
 * Only accessible to admin/superadmin users.
 * Should be removed or secured in production.
 * 
 * @component
 */

import React, { useState } from 'react';
import { showAlert } from '../utils/alerts.jsx';
import apiService from '../services/api';
import Swal from 'sweetalert2'; // Direct import for testing

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

    // Database Tests
    const testDatabaseConnection = async () => {
        setLoading(true);
        setResults('Testing database connection...');
        
        try {
            console.log('🧪 Testing Database Connection...');
            
            // Test multiple endpoints to verify database connectivity
            const tests = await Promise.allSettled([
                apiService.getProducts(),
                apiService.getServices(),
                apiService.getProjects()
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
                apiService.getServices(),
                apiService.getProjects()
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
                    services: await apiService.getServices().catch(e => ({ error: e.message })),
                    projects: await apiService.getProjects().catch(e => ({ error: e.message }))
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