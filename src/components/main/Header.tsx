import { Link, useLocation, useNavigate } from "react-router-dom";
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

  // Don't show header if user is authenticated OR if on dashboard/admin routes
  if (user !== null || location.pathname === '/admin' || location.pathname === '/dashboard') {
    return null;
  }

  const handleNavClick = (href: string) => {
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
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#138808" />
                  <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#FF9933" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1B2B5E]">
                {variant === "platform" ? "e-GramSeva" : panchayatName}
              </h1>
              {variant === "platform" && (
                <p className="text-xs text-[#666666]">
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
          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5 text-[#666]" />
            </Button>
            
            {/* Calendar */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Calendar className="h-5 w-5 text-[#666]" />
            </Button>
            
            {/* Accessibility */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Accessibility className="h-5 w-5 text-[#666]" />
            </Button>
            
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5 text-[#666]" />
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

            {variant === "platform" && (
              <Button 
                asChild
                className="hidden bg-[#E31E24] text-white hover:bg-[#C91A20] md:inline-flex"
              >
                <Link to="/login">
                  <User className="mr-2 h-4 w-4" />
                  Sachiv Login
                </Link>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 pt-8">
                  {navigationItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.href)}
                      className="border-b border-[#E5E5E5] pb-3 text-base font-medium text-[#333] transition-colors hover:text-[#E31E24] text-left bg-transparent border-none w-full cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                  {variant === "platform" && (
                    <Button 
                      asChild
                      className="mt-4 bg-[#E31E24] text-white hover:bg-[#C91A20]"
                    >
                      <Link to="/login">
                        <User className="mr-2 h-4 w-4" />
                        Sachiv Login
                      </Link>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
