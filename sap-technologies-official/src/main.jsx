import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { HelmetProvider } from "./utils/helmet.jsx"
import "./styles/index.css"
import App from "./App.jsx"
import { ThemeProvider } from "./contexts/ThemeContext.jsx"

// Keep-alive handled by Cron-job.org external service
// No need for frontend keep-alive

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </BrowserRouter>,
)
