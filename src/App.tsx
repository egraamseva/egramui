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
  
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isPanchayat = location.pathname.startsWith("/panchayat");
  const isLogin = location.pathname === "/login";

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Render header based on current route */}
        {!isDashboard && !isLogin && (
          <Header
            variant={isPanchayat ? "panchayat" : "platform"}
            panchayatName={isPanchayat ? "Ramnagar" : undefined}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {/* Main content */}
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>

        {/* Render footer based on current route */}
        {!isDashboard && !isLogin && (
          <Footer variant={isPanchayat ? "panchayat" : "platform"} />
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
