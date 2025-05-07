import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/lib/setup"; // This ensures global setup is done before rendering

// Set page title and meta description
document.title = "MultiVend - Multi-Tenant eCommerce Platform";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "A powerful SaaS platform for creating and managing single-vendor eCommerce websites with subscription-based pricing.";
document.head.appendChild(metaDescription);

console.log("Mounting React application...");
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Root element found, rendering app");
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found! Check your HTML structure.");
}
