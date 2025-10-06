/**
 * Confirm Dialog Component
 * 
 * Reusable confirmation modal for destructive or important actions.
 * 
 * Features:
 * - Customizable title and message
 * - Two action types (danger, warning)
 * - Custom button text
 * - Icon based on type
 * - Modal overlay with backdrop
 * - Accessible button labels
 * 
 * Props:
 * - isOpen: Boolean to control visibility
 * - title: Dialog title text
 * - message: Confirmation message
 * - onConfirm: Callback for confirmation
 * - onCancel: Callback for cancel
 * - confirmText: Custom confirm button text (default: "Delete")
 * - cancelText: Custom cancel button text (default: "Cancel")
 * - type: "danger" or "warning" for styling
 * 
 * @component
 */

import React from "react";
import "../styles/ConfirmDialog.css";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-dialog">
        <div className="confirm-header">
          <div className={`confirm-icon ${type}`}>
            {type === "danger" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H3l6-9 6 9h-6z" />
                <path d="M9 17c0 2.21 1.79 4 4 4s4-1.79 4-4" />
              </svg>
            )}
          </div>
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-actions">
          <button 
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            className={`btn-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;