/**
 * Sachiv Dashboard Layout Component
 * Provides the sidebar navigation and header for all dashboard pages
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  ImageIcon,
  Settings,
  BarChart3,
  Eye,
  Megaphone,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import type { Language } from "../../types";

interface SidebarItem {
  id: string;
  translationKey: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    translationKey: "sidebar.dashboard",
    icon: LayoutDashboard,
    path: "/panchayat/dashboard",
  },
  {
    id: "posts",
    translationKey: "sidebar.posts",
    icon: Megaphone,
    path: "/panchayat/dashboard/posts",
  },
  {
    id: "announcements",
    translationKey: "sidebar.announcements",
    icon: FileText,
    path: "/panchayat/dashboard/announcements",
  },
  {
    id: "schemes",
    translationKey: "sidebar.schemes",
    icon: Users,
    path: "/panchayat/dashboard/schemes",
  },
  {
    id: "gallery",
    translationKey: "sidebar.gallery",
    icon: ImageIcon,
    path: "/panchayat/dashboard/gallery",
  },
  {
    id: "albums",
    translationKey: "sidebar.albums",
    icon: ImageIcon,
    path: "/panchayat/dashboard/albums",
  },
  {
    id: "newsletters",
    translationKey: "sidebar.newsletters",
    icon: FileText,
    path: "/panchayat/dashboard/newsletters",
  },
  {
    id: "documents",
    translationKey: "sidebar.documents",
    icon: FileText,
    path: "/panchayat/dashboard/documents",
  },
  {
    id: "comments",
    translationKey: "sidebar.comments",
    icon: MessageSquare,
    path: "/panchayat/dashboard/comments",
  },
  {
    id: "team",
    translationKey: "sidebar.team",
    icon: Users,
    path: "/panchayat/dashboard/team",
  },
  {
    id: "analytics",
    translationKey: "sidebar.analytics",
    icon: BarChart3,
    path: "/panchayat/dashboard/analytics",
  },
  {
    id: "website",
    translationKey: "sidebar.website",
    icon: Globe,
    path: "/panchayat/dashboard/website",
  },
  {
    id: "settings",
    translationKey: "sidebar.settings",
    icon: Settings,
    path: "/panchayat/dashboard/settings",
  },
];

export function SachivDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/panchayat/dashboard") {
      return location.pathname === "/panchayat/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-[#E5E5E5] bg-white shadow-sm lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-[#E5E5E5] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#138808" />
                <path
                  d="M12 4 L12 20 M4 12 L20 12"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="3" fill="#FF9933" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1B2B5E]">
              {user?.panchayatName || "Panchayat"} {t("sidebar.panchayatGP")}
            </h3>
            <p className="text-xs text-[#666]">
              {t("sidebar.sachivDashboard")}
            </p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-[#E31E24] text-white font-medium shadow-sm"
                    : "text-[#666] hover:bg-[#F5F5F5] hover:text-[#1B2B5E]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.translationKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#E5E5E5] bg-white shadow-lg transition-transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-[#E5E5E5] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#138808" />
                  <path
                    d="M12 4 L12 20 M4 12 L20 12"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="3" fill="#FF9933" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1B2B5E]">
                {user?.panchayatName || "Panchayat"} {t("sidebar.panchayatGP")}
              </h3>
              <p className="text-xs text-[#666]">
                {t("sidebar.sachivDashboard")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-1 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-[#E31E24] text-white font-medium shadow-sm"
                    : "text-[#666] hover:bg-[#F5F5F5] hover:text-[#1B2B5E]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.translationKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 w-0 min-w-0">
        {/* Top Bar */}
        <header className="flex h-auto min-h-[4rem] items-center justify-between border-b border-[#E5E5E5] bg-white px-3 sm:px-6 py-3 gap-2 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold truncate">
                {t("sidebar.welcomeBack", { name: user?.name || "User" })}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {t("sidebar.todayOverview")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-5 w-5 text-[#666]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                  {t("panchayatWebsite.languages.english")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("mr")}>
                  {t("panchayatWebsite.languages.marathi")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("hi")}>
                  {t("panchayatWebsite.languages.hindi")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => i18n.changeLanguage("regional")}
                >
                  {t("panchayatWebsite.languages.regional")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/panchayat/${user?.panchayatName?.toLowerCase() || "demo"}`
                )
              }
              className="hidden sm:inline-flex"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t("sidebar.viewWebsite")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                navigate(
                  `/panchayat/${user?.panchayatName?.toLowerCase() || "demo"}`
                )
              }
              className="sm:hidden"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:inline-flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("sidebar.logout")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Avatar className="hidden sm:flex">
              <AvatarFallback className="bg-primary text-white">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
