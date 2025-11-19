import { BrowserRouter, useLocation } from "react-router-dom";
import { Footer } from "./components/main/Footer";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { AppRoutes } from "./routes";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Language } from "./types";
import { Header } from "./components/main/Header";
import "./utils/testAPI"; // Load test API for browser console testing

function AppContent() {
  const location = useLocation();
  const [, setLanguage] = useLocalStorage<Language>("language", "en");
  
  // Routes where header should NOT be shown
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/login" || 
                     location.pathname === "/forgot-password" || 
                     location.pathname === "/reset-password";
  
  // Public panchayat website routes (header SHOULD show here)
  const isPanchayatWebsite = location.pathname.startsWith("/panchayat/") || 
                             location.pathname === "/panchayat-demo";
  
  // Determine if header should be shown
  const shouldShowHeader = !isDashboard && !isAdmin && !isAuthPage;

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Render header based on current route */}
        {shouldShowHeader && (
          <Header
            variant={isPanchayatWebsite ? "panchayat" : "platform"}
            panchayatName={isPanchayatWebsite ? "Ramnagar" : undefined}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {/* Main content */}
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>

        {/* Render footer based on current route */}
        {shouldShowHeader && (
          <Footer variant={isPanchayatWebsite ? "panchayat" : "platform"} />
        )}

        {/* Toast notifications */}
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
