import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, Globe, User, Search, Calendar, Accessibility } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import type { Language } from "../../types";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  variant?: "platform" | "panchayat";
  panchayatName?: string;
  onLanguageChange?: (lang: Language) => void;
}

export function Header({ variant = "platform", panchayatName, onLanguageChange }: HeaderProps) {

  const {user} = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show header on dashboard/admin routes (handled by App.tsx, but double-check here)
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/panchayat/dashboard')) {
    return null;
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    // If already on home page, prevent navigation and just scroll to top
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Let React Router handle navigation, then scroll to top after navigation
      // The Link component will handle the navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleNavClick = (href: string, closeMenu = false) => {
    // Close mobile menu if needed
    if (closeMenu) {
      setMobileMenuOpen(false);
    }
    
    // For hash links, navigate to home page first if not already there
    if (href.startsWith('#')) {
      // If we're on the landing page, just scroll
      if (location.pathname === '/') {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to home page with hash
        navigate(`/${href}`);
        // After navigation, scroll to the section
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  const navigationItems = variant === "platform"
    ? [
        { label: "Home", href: "#home" },
        { label: "Features", href: "#features" },
        { label: "Panchayats", href: "#panchayats" },
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
      ]
    : [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Schemes", href: "#schemes" },
        { label: "Projects", href: "#projects" },
        { label: "Gallery", href: "#gallery" },
        { label: "Contact", href: "#contact" },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E5] bg-white shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo and Brand */}
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0 min-w-0 cursor-pointer"
          >
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px] flex-shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#138808" />
                  <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#FF9933" />
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg font-semibold text-[#1B2B5E] truncate">
                {variant === "platform" ? "e-GramSeva" : (panchayatName || "Panchayat")}
              </h1>
              {variant === "platform" && (
                <p className="hidden sm:block text-xs text-[#666666]">
                  Digital Platform for Gram Panchayats
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-sm font-medium text-[#333] transition-colors hover:text-[#E31E24] cursor-pointer bg-transparent border-none"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search Icon - Desktop only */}
            <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#666]" />
            </Button>
            
            {/* Calendar - Desktop only */}
            <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#666]" />
            </Button>
            
            {/* Accessibility - Desktop only */}
            <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
              <Accessibility className="h-4 w-4 sm:h-5 sm:w-5 text-[#666]" />
            </Button>
            
            {/* Language Selector - Show on all screens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#666]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLanguageChange?.("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange?.("hi")}>
                  हिंदी
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange?.("regional")}>
                  Regional
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login/Dashboard Button - Desktop only */}
            {variant === "platform" && (
              user ? (
                <Button 
                  onClick={() => {
                    // Redirect to appropriate dashboard based on user role
                    if (user.role === 'SUPER_ADMIN') {
                      navigate('/admin');
                    } else {
                      navigate('/panchayat/dashboard');
                    }
                  }}
                  className="hidden bg-[#E31E24] text-white hover:bg-[#C91A20] md:inline-flex h-9"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Go to Dashboard</span>
                  <span className="lg:hidden">Dashboard</span>
                </Button>
              ) : (
                <Button 
                  asChild
                  className="hidden bg-[#E31E24] text-white hover:bg-[#C91A20] md:inline-flex h-9"
                >
                  <Link to="/login">
                    <User className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">Sachiv Login</span>
                    <span className="lg:hidden">Login</span>
                  </Link>
                </Button>
              )
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 sm:h-9 sm:w-9">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] flex flex-col p-0 overflow-hidden">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="px-4 pt-6 pb-4 border-b border-[#E5E5E5] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px] flex-shrink-0">
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#138808" />
                            <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" fill="#FF9933" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-[#1B2B5E] truncate">
                          {variant === "platform" ? "e-GramSeva" : (panchayatName || "Panchayat")}
                        </h2>
                        {variant === "platform" && (
                          <p className="text-xs text-[#666666]">
                            Digital Platform
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex flex-col gap-1 flex-1 overflow-y-auto px-4 py-4">
                    {navigationItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          handleNavClick(item.href, true);
                        }}
                        className="flex items-center justify-between px-4 py-3 text-base font-medium text-[#333] transition-colors hover:bg-[#F5F5F5] hover:text-[#E31E24] rounded-lg text-left w-full active:bg-[#F5F5F5]"
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>

                  {/* Mobile Menu Footer Actions */}
                  <div className="mt-auto pt-4 pb-4 border-t border-[#E5E5E5] space-y-3 px-4 flex-shrink-0 bg-white">
                    {/* Language Selector in Mobile Menu */}
                    <div>
                      <p className="text-xs font-medium text-[#666] mb-2">Language</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onLanguageChange?.("en");
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 text-xs h-8"
                        >
                          English
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onLanguageChange?.("hi");
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 text-xs h-8"
                        >
                          हिंदी
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onLanguageChange?.("regional");
                            setMobileMenuOpen(false);
                          }}
                          className="flex-1 text-xs h-8"
                        >
                          Regional
                        </Button>
                      </div>
                    </div>

                    {/* Login/Dashboard Button */}
                    {variant === "platform" && (
                      user ? (
                        <Button 
                          onClick={() => {
                            // Redirect to appropriate dashboard based on user role
                            if (user.role === 'SUPER_ADMIN') {
                              navigate('/admin');
                            } else {
                              navigate('/panchayat/dashboard');
                            }
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-[#E31E24] text-white hover:bg-[#C91A20] h-10"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Go to Dashboard
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            navigate('/login');
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-[#E31E24] text-white hover:bg-[#C91A20] h-10"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Sachiv Login
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
