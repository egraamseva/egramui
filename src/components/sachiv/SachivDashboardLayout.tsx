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
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/panchayat/dashboard" },
  { id: "posts", label: "Posts", icon: Megaphone, path: "/panchayat/dashboard/posts" },
  { id: "announcements", label: "Announcements", icon: FileText, path: "/panchayat/dashboard/announcements" },
  { id: "schemes", label: "Schemes", icon: Users, path: "/panchayat/dashboard/schemes" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, path: "/panchayat/dashboard/gallery" },
  { id: "albums", label: "Albums", icon: ImageIcon, path: "/panchayat/dashboard/albums" },
  { id: "documents", label: "Documents", icon: FileText, path: "/panchayat/dashboard/documents" },
  { id: "comments", label: "Comments", icon: MessageSquare, path: "/panchayat/dashboard/comments" },
  { id: "team", label: "Team", icon: Users, path: "/panchayat/dashboard/team" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/panchayat/dashboard/analytics" },
  { id: "settings", label: "Settings", icon: Settings, path: "/panchayat/dashboard/settings" },
];

export function SachivDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
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
                <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="#FF9933" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1B2B5E]">
              {user?.panchayatName || "Panchayat"} GP
            </h3>
            <p className="text-xs text-[#666]">Sachiv Dashboard</p>
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
                <span>{item.label}</span>
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
                  <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#FF9933" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1B2B5E]">
                {user?.panchayatName || "Panchayat"} GP
              </h3>
              <p className="text-xs text-[#666]">Sachiv Dashboard</p>
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
                <span>{item.label}</span>
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
                Welcome back, {user?.name || "User"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Here's what's happening with your Panchayat today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/panchayat/${user?.panchayatName?.toLowerCase() || "demo"}`)
              }
              className="hidden sm:inline-flex"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Website
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                navigate(`/panchayat/${user?.panchayatName?.toLowerCase() || "demo"}`)
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
              Logout
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
                {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
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

