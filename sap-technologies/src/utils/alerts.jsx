// SweetAlert2 and React Spinners utility
// Provides consistent alert dialogs and loading spinners across the application

import Swal from 'sweetalert2';
import { 
  BounceLoader, 
  ClipLoader, 
  DotLoader, 
  FadeLoader, 
  GridLoader, 
  HashLoader, 
  PacmanLoader, 
  PulseLoader, 
  RingLoader, 
  ScaleLoader, 
  SyncLoader 
} from 'react-spinners';

// SweetAlert2 Configuration - separate configs for regular alerts and toasts
const baseConfig = {
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#ef4444',
  background: '#ffffff',
  color: '#1f2937'
};

// Configuration for regular alerts (not toast)
const swalConfig = {
  ...baseConfig,
  timer: 5000, // Auto-close after 5 seconds
  timerProgressBar: true, // Show countdown progress bar
  showConfirmButton: false, // Don't show buttons by default (allows auto-close)
  allowOutsideClick: true, // Allow clicking outside to close
  allowEscapeKey: true, // Allow ESC key to close
  width: '350px'
};

// Configuration for toast notifications
const toastConfig = {
  ...baseConfig,
  toast: true,
  position: 'bottom-end',
  timer: 5000,
  timerProgressBar: true,
  showConfirmButton: false,
  width: '350px'
  // Note: allowOutsideClick and allowEscapeKey are not compatible with toast mode
};

// Custom SweetAlert2 Functions
export const showAlert = {
  // Success Alert
  success: (title, text = '', options = {}) => {
    // Create clean configuration - explicitly override defaults
    const finalOptions = {
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#3b82f6',
      background: '#ffffff',
      color: '#1f2937',
      ...options // Allow options to override everything
    };
    
    return Swal.fire(finalOptions);
  },

  // Error Alert
  error: (title, text = '', options = {}) => {
    // Create clean configuration for errors
    const finalOptions = {
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#ef4444',
      background: '#ffffff',
      color: '#1f2937',
      showConfirmButton: true, // Always show confirm for errors
      confirmButtonText: 'OK',
      ...options
    };
    
    return Swal.fire(finalOptions);
  },

  // Warning Alert - auto-disappears after 5 seconds
  warning: (title, text = '', options = {}) => {
    const finalOptions = {
      timer: 5000, // Auto-close after 5 seconds
      timerProgressBar: true, // Show progress bar
      showConfirmButton: false, // Remove button for auto-close
      ...swalConfig,
      ...options
    };
    
    // If timer exists and showConfirmButton isn't explicitly true, hide button for auto-close
    if ((finalOptions.timer || finalOptions.timer === 0) && finalOptions.showConfirmButton !== true) {
      finalOptions.showConfirmButton = false;
    }
    
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      ...finalOptions
    });
  },

  // Info Alert - auto-disappears after 5 seconds
  info: (title, text = '', options = {}) => {
    const finalOptions = {
      timer: 5000, // Auto-close after 5 seconds
      timerProgressBar: true, // Show progress bar
      showConfirmButton: false, // Remove button for auto-close
      ...swalConfig,
      ...options
    };
    
    // If timer exists and showConfirmButton isn't explicitly true, hide button for auto-close
    if ((finalOptions.timer || finalOptions.timer === 0) && finalOptions.showConfirmButton !== true) {
      finalOptions.showConfirmButton = false;
    }
    
    return Swal.fire({
      icon: 'info',
      title,
      text,
      ...finalOptions
    });
  },

  // Confirmation Dialog - requires user action, doesn't auto-close
  confirm: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      timer: null, // Don't auto-close confirmation dialogs
      showConfirmButton: true, // User must click to proceed
      ...swalConfig,
      ...options
    });
  },

  // Delete Confirmation - requires user action, doesn't auto-close
  deleteConfirm: (itemName = 'item', options = {}) => {
    return Swal.fire({
      icon: 'warning',
      title: 'Delete Confirmation',
      text: `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      timer: null, // Don't auto-close delete confirmations
      showConfirmButton: true, // User must confirm
      ...swalConfig,
      ...options
    });
  },

  // Critical Error - requires user acknowledgment, doesn't auto-close
  criticalError: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      showConfirmButton: true, // User must acknowledge
      confirmButtonText: 'I Understand',
      timer: null, // Don't auto-close critical errors
      timerProgressBar: false, // No progress bar for critical errors
      ...swalConfig,
      ...options
    });
  },

  // Loading Alert
  loading: (title = 'Processing...', text = 'Please wait') => {
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...swalConfig
    });
  },

  // Custom Alert with HTML content - auto-disappears unless overridden
  custom: (htmlContent, options = {}) => {
    const finalOptions = {
      timer: 5000, // Auto-close after 5 seconds by default
      timerProgressBar: true, // Show progress bar
      showConfirmButton: false, // No button by default for auto-close
      ...swalConfig,
      ...options
    };
    
    // If timer exists and showConfirmButton isn't explicitly true, hide button for auto-close
    if ((finalOptions.timer || finalOptions.timer === 0) && finalOptions.showConfirmButton !== true) {
      finalOptions.showConfirmButton = false;
    }
    
    // Debug logging to see what's being passed
    console.log('🎨 Custom Alert Debug:', {
      htmlContent,
      originalOptions: options,
      finalOptions,
      hasTimer: !!(finalOptions.timer || finalOptions.timer === 0),
      showConfirmButton: finalOptions.showConfirmButton
    });
    
    return Swal.fire({
      html: htmlContent,
      ...finalOptions
    });
  },

  // Toast Notification
  toast: (message, type = 'success', options = {}) => {
    const finalOptions = {
      ...toastConfig,
      position: options.position || 'top-end', // Allow position override
      ...options
    };
    
    return Swal.fire({
      icon: type,
      title: message,
      ...finalOptions
    });
  },

  // Input Dialog
  input: (title, inputType = 'text', placeholder = '', options = {}) => {
    return Swal.fire({
      title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'This field is required!';
        }
      },
      ...swalConfig,
      ...options
    });
  }
};

// Close any open SweetAlert
export const closeSwal = () => {
  Swal.close();
};

// React Spinners Components with default configurations
export const Spinners = {
  // Bounce Loader - Good for loading states
  Bounce: ({ loading = true, color = '#3b82f6', size = 60, ...props }) => (
    <BounceLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Clip Loader - Circular spinner
  Clip: ({ loading = true, color = '#3b82f6', size = 35, ...props }) => (
    <ClipLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Dot Loader - Three dots animation
  Dot: ({ loading = true, color = '#3b82f6', size = 60, ...props }) => (
    <DotLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Fade Loader - Bars fading in and out
  Fade: ({ loading = true, color = '#3b82f6', height = 15, width = 5, ...props }) => (
    <FadeLoader loading={loading} color={color} height={height} width={width} {...props} />
  ),

  // Grid Loader - Grid of squares
  Grid: ({ loading = true, color = '#3b82f6', size = 15, ...props }) => (
    <GridLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Hash Loader - Hash symbol rotation
  Hash: ({ loading = true, color = '#3b82f6', size = 50, ...props }) => (
    <HashLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Pacman Loader - Pacman eating dots
  Pacman: ({ loading = true, color = '#3b82f6', size = 25, ...props }) => (
    <PacmanLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Pulse Loader - Pulsing dots
  Pulse: ({ loading = true, color = '#3b82f6', size = 15, margin = 2, ...props }) => (
    <PulseLoader loading={loading} color={color} size={size} margin={margin} {...props} />
  ),

  // Ring Loader - Ring with moving border
  Ring: ({ loading = true, color = '#3b82f6', size = 60, ...props }) => (
    <RingLoader loading={loading} color={color} size={size} {...props} />
  ),

  // Scale Loader - Scaling bars
  Scale: ({ loading = true, color = '#3b82f6', height = 35, width = 4, ...props }) => (
    <ScaleLoader loading={loading} color={color} height={height} width={width} {...props} />
  ),

  // Sync Loader - Synchronized dots
  Sync: ({ loading = true, color = '#3b82f6', size = 15, margin = 2, ...props }) => (
    <SyncLoader loading={loading} color={color} size={size} margin={margin} {...props} />
  )
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  isLoading, 
  spinnerType = 'Clip', 
  message = 'Loading...', 
  overlay = true,
  spinnerProps = {} 
}) => {
  if (!isLoading) return null;

  const SpinnerComponent = Spinners[spinnerType] || Spinners.Clip;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    color: 'white'
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  };

  return (
    <div style={overlay ? overlayStyle : contentStyle}>
      <SpinnerComponent {...spinnerProps} />
      {message && (
        <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: '500' }}>
          {message}
        </p>
      )}
    </div>
  );
};

// Button with loading state
export const LoadingButton = ({ 
  children, 
  loading = false, 
  spinnerType = 'Clip', 
  spinnerSize = 20,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const SpinnerComponent = Spinners[spinnerType] || Spinners.Clip;

  return (
    <button
      className={`loading-button ${className} ${loading ? 'loading' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      {...props}
    >
      {loading && (
        <SpinnerComponent 
          loading={true} 
          size={spinnerSize} 
          color="currentColor"
        />
      )}
      <span style={{ opacity: loading ? 0.7 : 1 }}>
        {children}
      </span>
    </button>
  );
};

// Utility function for common loading patterns
export const withLoading = async (asyncFunction, options = {}) => {
  const {
    loadingTitle = 'Processing...',
    loadingText = 'Please wait',
    successTitle = 'Success!',
    successText = 'Operation completed successfully',
    errorTitle = 'Error',
    showSuccess = true,
    showError = true
  } = options;

  // Show loading
  showAlert.loading(loadingTitle, loadingText);

  try {
    const result = await asyncFunction();
    
    // Close loading and show success
    closeSwal();
    if (showSuccess) {
      showAlert.success(successTitle, successText);
    }
    
    return result;
  } catch (error) {
    // Close loading and show error
    closeSwal();
    if (showError) {
      showAlert.error(errorTitle, error.message || 'An unexpected error occurred');
    }
    throw error;
  }
};

// Export individual spinners for direct use
export {
  BounceLoader,
  ClipLoader,
  DotLoader,
  FadeLoader,
  GridLoader,
  HashLoader,
  PacmanLoader,
  PulseLoader,
  RingLoader,
  ScaleLoader,
  SyncLoader
};

// Export SweetAlert2 for advanced usage
export { Swal };

/* 
Alert Usage Guide:
- showAlert.success() - Auto-disappears after 5 seconds ✓
- showAlert.error() - Auto-disappears after 5 seconds ✓
- showAlert.warning() - Auto-disappears after 5 seconds ✓
- showAlert.info() - Auto-disappears after 5 seconds ✓
- showAlert.criticalError() - Requires user acknowledgment (no auto-close)
- showAlert.confirm() - Requires user action (no auto-close)
- showAlert.deleteConfirm() - Requires user confirmation (no auto-close)
- showAlert.toast() - Auto-disappears after 5 seconds ✓
- showAlert.custom() - Auto-disappears after 5 seconds by default ✓

All alerts with timers show a progress bar and can be closed by:
- Waiting 5 seconds (auto-close)
- Clicking outside the alert
- Pressing ESC key
*/