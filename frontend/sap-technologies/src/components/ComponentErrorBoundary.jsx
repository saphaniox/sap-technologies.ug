/**
 * Component Error Boundary
 * 
 * Error boundary wrapper for individual components to prevent
 * full app crashes from component-level errors.
 * 
 * Features:
 * - Catches JavaScript errors in child components
 * - Displays user-friendly error fallback UI
 * - Provides retry functionality
 * - Logs errors to console for debugging
 * - Shows component name in error message
 * - Prevents error propagation to parent components
 * 
 * Usage:
 * Wrap any component that might throw errors:
 * <ComponentErrorBoundary componentName="MyComponent">
 *   <MyComponent />
 * </ComponentErrorBoundary>
 * 
 * Props:
 * - componentName: Display name for error message
 * - children: Component(s) to wrap and protect
 * 
 * @component
 */

import React from "react";

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="component-error-fallback">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>Unable to load {this.props.componentName || "component"}</p>
            <button 
              className="retry-btn"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;