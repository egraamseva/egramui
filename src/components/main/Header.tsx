import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, Globe, User, X } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { Logo } from "../logo/Logo";

interface HeaderProps {
  variant?: "platform" | "panchayat";
  panchayatName?: string;
  onLanguageChange?: (lang: Language) => void;
}

export function Header({
  variant = "platform",
  panchayatName,
  onLanguageChange,
}: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/panchayat/dashboard")
  ) {
    return null;
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const handleNavClick = (href: string, closeMenu = false) => {
    if (closeMenu) {
      setMobileMenuOpen(false);
    }

    if (href.startsWith("#")) {
      if (location.pathname === "/") {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate(`/${href}`);
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    }
  };

  const navigationItems =
    variant === "platform"
      ? [
          { label: t("nav.home"), href: "#home" },
          { label: t("nav.features"), href: "#features" },
          { label: t("nav.panchayats"), href: "#panchayats" },
          { label: t("nav.news"), href: "#news" },
          { label: t("nav.contact"), href: "#contact" },
        ]
      : [
          { label: t("nav.home"), href: "#home" },
          { label: t("nav.news"), href: "#news" },
          { label: t("nav.schemes"), href: "#schemes" },
          { label: t("nav.projects"), href: "#projects" },
          { label: t("nav.gallery"), href: "#gallery" },
          { label: t("nav.contact"), href: "#contact" },
        ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Logo size="small" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLanguageChange?.("en")}>
                  {t("panchayatWebsite.languages.english")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange?.("mr")}>
                  {t("panchayatWebsite.languages.marathi")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange?.("hi")}>
                  {t("panchayatWebsite.languages.hindi")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onLanguageChange?.("regional")}
                >
                  {t("panchayatWebsite.languages.regional")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dashboard/Login Button - Desktop */}
            {variant === "platform" && (
              <div className="hidden md:block">
                {user ? (
                  <Button
                    onClick={() => {
                      navigate(
                        user.role === "SUPER_ADMIN"
                          ? "/admin"
                          : "/panchayat/dashboard"
                      );
                    }}
                    className="bg-red-600 text-white hover:bg-red-700 h-9"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">
                      {t("nav.dashboard")}
                    </span>
                    <span className="lg:hidden">Dashboard</span>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="bg-red-600 text-white hover:bg-red-700 h-9"
                  >
                    <Link to="/login">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden lg:inline">{t("nav.login")}</span>
                      <span className="lg:hidden">Login</span>
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-[11/12]">
                  {/* Mobile Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {variant === "platform"
                        ? "e-GramSeva"
                        : panchayatName || "Panchayat"}
                    </h2>
                    {variant === "platform" && (
                      <p className="text-sm text-gray-600">Digital Platform</p>
                    )}
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 overflow-y-auto px-4 py-4">
                    {navigationItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavClick(item.href, true)}
                        className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    {/* Language Selector */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        {t("nav.language")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            labelKey: "panchayatWebsite.languages.english",
                            lang: "en",
                          },
                          {
                            labelKey: "panchayatWebsite.languages.marathi",
                            lang: "mr",
                          },
                          {
                            labelKey: "panchayatWebsite.languages.hindi",
                            lang: "hi",
                          },
                          {
                            labelKey: "panchayatWebsite.languages.regional",
                            lang: "regional",
                          },
                        ].map(({ labelKey, lang }) => (
                          <Button
                            key={lang}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onLanguageChange?.(lang as Language);
                              setMobileMenuOpen(false);
                            }}
                            className="text-xs"
                          >
                            {t(labelKey)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Login/Dashboard Button */}
                    {variant === "platform" &&
                      (user ? (
                        <Button
                          onClick={() => {
                            navigate(
                              user.role === "SUPER_ADMIN"
                                ? "/admin"
                                : "/panchayat/dashboard"
                            );
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <User className="mr-2 h-4 w-4" />
                          {t("nav.dashboard")}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            navigate("/login");
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <User className="mr-2 h-4 w-4" />
                          {t("nav.login")}
                        </Button>
                      ))}
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
