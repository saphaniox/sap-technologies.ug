// Demo component showcasing SweetAlert2 and React Spinners usage
// This component demonstrates all available alerts and spinner types

import React, { useState } from "react";
import { showAlert, Spinners, LoadingOverlay, LoadingButton, withLoading } from "../utils/alerts.jsx";

const AlertsDemo = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Demo functions for different alert types
  const demoSuccess = () => {
    showAlert.success(
      "Success!",
      "This is a success message with auto-close timer.",
      { timer: 3000 }
    );
  };

  const demoError = () => {
    showAlert.error(
      "Error Occurred",
      "This is an error message that requires user acknowledgment."
    );
  };

  const demoWarning = () => {
    showAlert.warning(
      "Warning!",
      "This is a warning message about potential issues."
    );
  };

  const demoInfo = () => {
    showAlert.info(
      "Information",
      "This is an informational message with useful details."
    );
  };

  const demoConfirm = async () => {
    const result = await showAlert.confirm(
      "Are you sure?",
      "This action will demonstrate confirmation dialog."
    );
    
    if (result.isConfirmed) {
      showAlert.success("Confirmed!", "You clicked Yes");
    } else {
      showAlert.info("Cancelled", "You clicked Cancel");
    }
  };

  const demoDelete = async () => {
    const result = await showAlert.deleteConfirm("user account");
    
    if (result.isConfirmed) {
      showAlert.success("Deleted!", "The item has been deleted.");
    }
  };

  const demoInput = async () => {
    const result = await showAlert.input(
      "Enter your name",
      "text",
      "Type your name here..."
    );
    
    if (result.isConfirmed && result.value) {
      showAlert.success("Hello!", `Nice to meet you, ${result.value}!`);
    }
  };

  const demoToast = () => {
    showAlert.toast("This is a toast notification!", "success");
  };

  const demoLoading = async () => {
    showAlert.loading("Processing your request...", "Please wait while we handle this");
    
    // Simulate async operation
    setTimeout(() => {
      showAlert.success("Complete!", "Your request has been processed.");
    }, 3000);
  };

  const demoWithLoading = async () => {
    try {
      await withLoading(
        async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          return "Operation completed successfully";
        },
        {
          loadingTitle: "Processing...",
          loadingText: "Please wait while we process your request",
          successTitle: "Success!",
          successText: "Operation completed successfully",
          showSuccess: true
        }
      );
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const demoOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  const demoButtonLoading = async () => {
    setButtonLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setButtonLoading(false);
    showAlert.success("Done!", "Button loading demo completed");
  };

  const spinnerTypes = [
    "Bounce", "Clip", "Dot", "Fade", "Grid", 
    "Hash", "Pacman", "Pulse", "Ring", "Scale", "Sync"
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>SweetAlert2 & React Spinners Demo</h1>
      
      {/* SweetAlert2 Demos */}
      <section style={{ marginBottom: "40px" }}>
        <h2>SweetAlert2 Examples</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <button onClick={demoSuccess} style={buttonStyle}>Success Alert</button>
          <button onClick={demoError} style={buttonStyle}>Error Alert</button>
          <button onClick={demoWarning} style={buttonStyle}>Warning Alert</button>
          <button onClick={demoInfo} style={buttonStyle}>Info Alert</button>
          <button onClick={demoConfirm} style={buttonStyle}>Confirm Dialog</button>
          <button onClick={demoDelete} style={buttonStyle}>Delete Confirm</button>
          <button onClick={demoInput} style={buttonStyle}>Input Dialog</button>
          <button onClick={demoToast} style={buttonStyle}>Toast Notification</button>
          <button onClick={demoLoading} style={buttonStyle}>Loading Alert</button>
          <button onClick={demoWithLoading} style={buttonStyle}>With Loading</button>
        </div>
      </section>

      {/* React Spinners Demo */}
      <section style={{ marginBottom: "40px" }}>
        <h2>React Spinners Gallery</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "20px", textAlign: "center" }}>
          {spinnerTypes.map(type => {
            const SpinnerComponent = Spinners[type];
            return (
              <div key={type} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <div style={{ height: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <SpinnerComponent loading={true} color="#3b82f6" />
                </div>
                <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>{type}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Loading Components Demo */}
      <section>
        <h2>Loading Components</h2>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={demoOverlay} style={buttonStyle}>
            Show Loading Overlay
          </button>
          
          <LoadingButton
            loading={buttonLoading}
            onClick={demoButtonLoading}
            spinnerType="Pulse"
            style={{
              ...buttonStyle,
              minWidth: "150px"
            }}
          >
            Loading Button
          </LoadingButton>
        </div>
      </section>

      {/* Loading Overlay */}
      <LoadingOverlay
        isLoading={showOverlay}
        spinnerType="Ring"
        message="Loading content..."
        spinnerProps={{ color: "#3b82f6", size: 60 }}
      />

      {/* Usage Code Examples */}
      <section style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <h2>Usage Examples</h2>
        <pre style={{ fontSize: "12px", overflow: "auto" }}>
{`// Import the utilities
import { showAlert, Spinners, LoadingButton, LoadingOverlay } from "../utils/alerts";

// Success alert
await showAlert.success("Success!", "Operation completed successfully");

// Error alert
await showAlert.error("Error", "Something went wrong");

// Confirmation
const result = await showAlert.confirm("Are you sure?", "This cannot be undone");
if (result.isConfirmed) {
  // User confirmed
}

// Loading button
<LoadingButton
  loading={isLoading}
  onClick={handleClick}
  spinnerType="Pulse"
>
  Submit
</LoadingButton>

// Loading overlay
<LoadingOverlay
  isLoading={isLoading}
  spinnerType="Ring"
  message="Processing..."
/>

// Individual spinner
<Spinners.Clip loading={true} color="#3b82f6" size={35} />

// With loading wrapper
await withLoading(
  async () => {
    // Your async operation
  },
  {
    loadingTitle: "Processing...",
    successTitle: "Success!"
  }
);`}
        </pre>
      </section>
    </div>
  );
};

const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "background-color 0.2s"
};

export default AlertsDemo;