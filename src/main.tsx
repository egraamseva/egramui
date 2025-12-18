import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./styles/globals.css";

// Safeguard: Prevent React Router from setting properties on undefined
// This is a workaround for React Router 7's activity tracking initialization
if (typeof window !== 'undefined') {
  // Ensure window object is fully initialized
  if (!window.history) {
    console.warn('History API not available');
  }
  
  // Polyfill: Ensure global object exists for React Router's internal tracking
  // React Router 7 may try to set Activity property on a global object
  if (typeof globalThis === 'undefined') {
    (window as any).globalThis = window;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);