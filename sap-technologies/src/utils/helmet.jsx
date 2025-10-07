/**
 * React 19 compatible document head management
 * Replaces react-helmet-async for React 19 compatibility
 */
import { useEffect } from 'react';

// HelmetProvider component (no-op for React 19)
export const HelmetProvider = ({ children }) => {
    return children;
};

// Helmet component using native document manipulation
export const Helmet = ({ children }) => {
    useEffect(() => {
        const elements = [];
        
        // Parse children to extract title and meta tags
        if (children) {
            const childArray = Array.isArray(children) ? children : [children];
            
            childArray.forEach(child => {
                if (!child) return;
                
                if (child.type === 'title') {
                    document.title = child.props.children;
                } else if (child.type === 'meta') {
                    const meta = document.createElement('meta');
                    Object.keys(child.props).forEach(key => {
                        meta.setAttribute(key, child.props[key]);
                    });
                    document.head.appendChild(meta);
                    elements.push(meta);
                }
            });
        }
        
        // Cleanup function to remove added elements
        return () => {
            elements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        };
    }, [children]);
    
    return null;
};