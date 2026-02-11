import { BrowserRouter, useLocation } from "react-router-dom";
import { Footer } from "./components/main/Footer";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { GlobalLoader } from "./components/main/GlobalLoader";
import { AppRoutes } from "./routes";
import type { Language } from "./types";
import { Header } from "./components/main/Header";
import { useTranslation } from "react-i18next";
import { isMainWebsiteDomain } from "./config/mainDomain";
import "./i18n"; // Initialize i18next
import "./utils/testAPI"; // Load test API for browser console testing

function AppContent() {
  const location = useLocation();
  const { i18n } = useTranslation();

  // Routes where header should NOT be shown
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/login" ||
                     location.pathname === "/forgot-password" ||
                     location.pathname === "/reset-password";

  // Public panchayat website routes (header should NOT show here - independent site)
  const isPanchayatWebsite = (location.pathname.startsWith("/panchayat/") && 
                              !location.pathname.startsWith("/panchayat/dashboard")) ||
                             location.pathname === "/panchayat-demo";

  // Root on custom domain shows panchayat site (no platform header)
  const isCustomDomainRoot = location.pathname === "/" && !isMainWebsiteDomain(window.location.hostname);

  // Determine if header should be shown
  const shouldShowHeader = !isDashboard && !isAdmin && !isAuthPage && !isPanchayatWebsite && !isCustomDomainRoot;

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Render header based on current route */}
        {shouldShowHeader && (
          <Header
            variant="platform"
            onLanguageChange={handleLanguageChange}
          />
        )}

        {/* Main content */}
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>

        {/* Render footer based on current route */}
        {shouldShowHeader && (
          <Footer variant="platform" />
        )}

        {/* Toast notifications */}
        <Toaster />
        
        {/* Global Loader */}
        <GlobalLoader />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}
