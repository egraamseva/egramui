/**
 * Super Admin Dashboard
 * Platform-wide management interface
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import type { SuperAdminPanchayat, AdminUser, AuditLog, PanchayatStatus } from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { superAdminAPI } from "@/services/api";

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [panchayats, setPanchayats] = useState<SuperAdminPanchayat[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState({
    totalPanchayats: 0,
    totalUsers: 0,
    activePanchayats: 0,
    totalPosts: 0,
    totalSchemes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PanchayatStatus | "all">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPanchayatDialogOpen, setIsPanchayatDialogOpen] = useState(false);
  const [editingPanchayat, setEditingPanchayat] = useState<SuperAdminPanchayat | null>(null);
  const [panchayatFormData, setPanchayatFormData] = useState({
    panchayatName: "",
    slug: "",
    district: "",
    state: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
    description: "",
  });

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      navigate("/dashboard");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [panchayatsData, usersData, analyticsData, logsData] = await Promise.all([
        superAdminAPI.getAllPanchayats({ status: statusFilter !== "all" ? statusFilter : undefined, search: searchQuery || undefined }),
        superAdminAPI.getAllUsers(),
        superAdminAPI.getSystemAnalytics(),
        superAdminAPI.getAuditLogs(),
      ]);

      setPanchayats(panchayatsData);
      setUsers(usersData);
      setAnalytics(analyticsData);
      setAuditLogs(logsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "panchayats" || activeSection === "users") {
      fetchDashboardData();
    }
  }, [searchQuery, statusFilter]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePanchayatStatusChange = async (id: string, status: PanchayatStatus) => {
    try {
      await superAdminAPI.updatePanchayatStatus(id, status);
      toast.success(`Panchayat ${status === "active" ? "activated" : "deactivated"} successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update panchayat status");
    }
  };

  const handleDeletePanchayat = async (id: string) => {
    if (!confirm("Are you sure you want to delete this panchayat?")) return;
    try {
      await superAdminAPI.deletePanchayat(id);
      toast.success("Panchayat deleted successfully");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete panchayat");
    }
  };

  const openCreatePanchayatDialog = () => {
    setEditingPanchayat(null);
    setPanchayatFormData({
      panchayatName: "",
      slug: "",
      district: "",
      state: "",
      address: "",
      contactPhone: "",
      contactEmail: "",
      description: "",
    });
    setIsPanchayatDialogOpen(true);
  };

  const openEditPanchayatDialog = async (panchayat: SuperAdminPanchayat) => {
    try {
      const { adminPanchayatApi } = await import('@/routes/api');
      const fullPanchayat = await adminPanchayatApi.getById(parseInt(panchayat.id));
      setEditingPanchayat(panchayat);
      setPanchayatFormData({
        panchayatName: fullPanchayat.panchayatName || panchayat.panchayatName,
        slug: fullPanchayat.slug || panchayat.slug,
        district: fullPanchayat.district || panchayat.district,
        state: fullPanchayat.state || panchayat.state,
        address: (fullPanchayat as any).address || (fullPanchayat as any).officeAddress || "",
        contactPhone: (fullPanchayat as any).contactPhone || (fullPanchayat as any).officePhone || "",
        contactEmail: (fullPanchayat as any).contactEmail || (fullPanchayat as any).officeEmail || "",
        description: (fullPanchayat as any).description || "",
      });
      setIsPanchayatDialogOpen(true);
    } catch (error) {
      console.error("Error loading panchayat:", error);
      // Fallback to using the panchayat data we already have
      setEditingPanchayat(panchayat);
      setPanchayatFormData({
        panchayatName: panchayat.panchayatName,
        slug: panchayat.slug,
        district: panchayat.district,
        state: panchayat.state,
        address: "",
        contactPhone: "",
        contactEmail: "",
        description: "",
      });
      setIsPanchayatDialogOpen(true);
    }
  };

  const closePanchayatDialog = () => {
    setIsPanchayatDialogOpen(false);
    setEditingPanchayat(null);
    setPanchayatFormData({
      panchayatName: "",
      slug: "",
      district: "",
      state: "",
      address: "",
      contactPhone: "",
      contactEmail: "",
      description: "",
    });
  };

  const handleCreatePanchayat = async () => {
    if (!panchayatFormData.panchayatName.trim()) {
      toast.error("Please enter panchayat name");
      return;
    }
    if (!panchayatFormData.slug.trim()) {
      toast.error("Please enter subdomain/slug");
      return;
    }
    if (!panchayatFormData.district.trim()) {
      toast.error("Please enter district");
      return;
    }
    if (!panchayatFormData.state.trim()) {
      toast.error("Please enter state");
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(panchayatFormData.slug.toLowerCase())) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    try {
      await superAdminAPI.createPanchayat({
        panchayatName: panchayatFormData.panchayatName.trim(),
        slug: panchayatFormData.slug.toLowerCase().trim(),
        district: panchayatFormData.district.trim(),
        state: panchayatFormData.state.trim(),
        address: panchayatFormData.address.trim() || undefined,
        contactPhone: panchayatFormData.contactPhone.trim() || undefined,
        contactEmail: panchayatFormData.contactEmail.trim() || undefined,
        description: panchayatFormData.description.trim() || undefined,
      });
      toast.success("Panchayat created successfully");
      closePanchayatDialog();
      fetchDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create panchayat";
      toast.error(message);
    }
  };

  const handleUpdatePanchayat = async () => {
    if (!editingPanchayat) return;
    if (!panchayatFormData.panchayatName.trim()) {
      toast.error("Please enter panchayat name");
      return;
    }
    if (!panchayatFormData.slug.trim()) {
      toast.error("Please enter subdomain/slug");
      return;
    }
    if (!panchayatFormData.district.trim()) {
      toast.error("Please enter district");
      return;
    }
    if (!panchayatFormData.state.trim()) {
      toast.error("Please enter state");
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(panchayatFormData.slug.toLowerCase())) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    try {
      await superAdminAPI.updatePanchayat(editingPanchayat.id, {
        panchayatName: panchayatFormData.panchayatName.trim(),
        slug: panchayatFormData.slug.toLowerCase().trim(),
        district: panchayatFormData.district.trim(),
        state: panchayatFormData.state.trim(),
        address: panchayatFormData.address.trim() || undefined,
        contactPhone: panchayatFormData.contactPhone.trim() || undefined,
        contactEmail: panchayatFormData.contactEmail.trim() || undefined,
        description: panchayatFormData.description.trim() || undefined,
      });
      toast.success("Panchayat updated successfully");
      closePanchayatDialog();
      fetchDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update panchayat";
      toast.error(message);
    }
  };

  const handleUserStatusChange = async (id: string, status: "active" | "inactive" | "suspended") => {
    try {
      await superAdminAPI.updateUserStatus(id, status);
      toast.success(`User ${status === "active" ? "activated" : "deactivated"} successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "panchayats", label: "Panchayats", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "audit-logs", label: "Audit Logs", icon: FileText },
  ];

  const dashboardStats = [
    { label: "Total Panchayats", value: analytics.totalPanchayats.toString(), icon: Building2, color: "#FF9933" },
    { label: "Active Panchayats", value: analytics.activePanchayats.toString(), icon: Building2, color: "#138808" },
    { label: "Total Users", value: analytics.totalUsers.toString(), icon: Users, color: "#FF9933" },
    { label: "Total Posts", value: analytics.totalPosts.toString(), icon: FileText, color: "#138808" },
  ];

  if (loading && activeSection === "dashboard") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31E24] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 border-r border-[#E5E5E5] bg-white shadow-sm lg:block h-full">
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
              <h3 className="text-sm font-semibold text-[#1B2B5E]">Super Admin</h3>
              <p className="text-xs text-[#666]">Platform Dashboard</p>
            </div>
          </div>
          <nav className="space-y-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeSection === item.id
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
                <h3 className="text-sm font-semibold text-[#1B2B5E]">Super Admin</h3>
                <p className="text-xs text-[#666]">Platform Dashboard</p>
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
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeSection === item.id
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
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
                <h1 className="text-xl font-bold text-[#1B2B5E]">Super Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-sm text-[#666] sm:inline">{user?.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-[#E5E5E5] text-[#666] hover:bg-[#F5F5F5]">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {activeSection === "dashboard" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B2B5E]">Platform Overview</h2>
                    <p className="text-sm sm:text-base text-[#666] mt-1">Monitor and manage the entire platform</p>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {dashboardStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-[#666]">{stat.label}</CardTitle>
                          <Icon className="h-5 w-5" style={{ color: stat.color }} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl sm:text-3xl font-bold" style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system activities and changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{log.userName}</p>
                            <p className="text-sm text-[#666]">{log.action} {log.resource}</p>
                          </div>
                          <span className="text-sm text-[#666]">{formatTimeAgo(log.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "panchayats" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B2B5E]">Panchayat Management</h2>
                    <p className="text-sm sm:text-base text-[#666] mt-1">Manage all registered panchayats</p>
                  </div>
                  <Button onClick={openCreatePanchayatDialog} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Panchayat
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
                        <Input
                          placeholder="Search panchayats..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PanchayatStatus | "all")}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile: Card View */}
                    <div className="block sm:hidden space-y-3">
                      {panchayats.length === 0 ? (
                        <div className="text-center py-8 text-[#666] text-sm">No panchayats found</div>
                      ) : (
                        panchayats.map((panchayat) => (
                          <Card key={panchayat.id}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-sm mb-1">{panchayat.panchayatName}</h3>
                                  <p className="text-xs text-muted-foreground">{panchayat.slug}</p>
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>Location: {panchayat.district}, {panchayat.state}</div>
                                  <div>Admins: {panchayat.adminCount}</div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <Badge variant={panchayat.status === "active" ? "default" : "secondary"} className="text-xs">
                                    {panchayat.status}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditPanchayatDialog(panchayat)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePanchayatStatusChange(panchayat.id, panchayat.status === "active" ? "inactive" : "active")}>
                                        {panchayat.status === "active" ? "Mark Inactive" : "Activate"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleDeletePanchayat(panchayat.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Subdomain</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Admins</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {panchayats.map((panchayat) => (
                            <TableRow key={panchayat.id}>
                              <TableCell className="font-medium">{panchayat.panchayatName}</TableCell>
                              <TableCell>{panchayat.slug}</TableCell>
                              <TableCell>{panchayat.district}, {panchayat.state}</TableCell>
                              <TableCell>{panchayat.adminCount}</TableCell>
                              <TableCell>
                                <Badge variant={panchayat.status === "active" ? "default" : "secondary"}>
                                  {panchayat.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditPanchayatDialog(panchayat)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePanchayatStatusChange(panchayat.id, panchayat.status === "active" ? "inactive" : "active")}>
                                      {panchayat.status === "active" ? (
                                        <>
                                          <X className="h-4 w-4 mr-2" />
                                          Mark Inactive
                                        </>
                                      ) : (
                                        <>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeletePanchayat(panchayat.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "users" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B2B5E]">User Management</h2>
                  <p className="text-sm sm:text-base text-[#666] mt-1">Manage all platform users</p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile: Card View */}
                    <div className="block sm:hidden space-y-3">
                      {users.length === 0 ? (
                        <div className="text-center py-8 text-[#666] text-sm">No users found</div>
                      ) : (
                        users.map((userItem) => (
                          <Card key={userItem.id}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-sm mb-1">{userItem.name}</h3>
                                  <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">{userItem.role}</Badge>
                                  <Badge variant={userItem.status === "active" ? "default" : "secondary"} className="text-xs">
                                    {userItem.status}
                                  </Badge>
                                  {userItem.panchayatName && (
                                    <span className="text-muted-foreground">Panchayat: {userItem.panchayatName}</span>
                                  )}
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleUserStatusChange(userItem.id, userItem.status === "active" ? "inactive" : "active")}
                                  >
                                    {userItem.status === "active" ? "Deactivate" : "Activate"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Panchayat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((userItem) => (
                            <TableRow key={userItem.id}>
                              <TableCell className="font-medium">{userItem.name}</TableCell>
                              <TableCell>{userItem.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{userItem.role}</Badge>
                              </TableCell>
                              <TableCell>{userItem.panchayatName || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant={userItem.status === "active" ? "default" : "secondary"}>
                                  {userItem.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUserStatusChange(userItem.id, userItem.status === "active" ? "inactive" : "active")}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {userItem.status === "active" ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "analytics" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B2B5E]">System Analytics</h2>
                  <p className="text-sm sm:text-base text-[#666] mt-1">Platform-wide analytics and insights</p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-[#666]">Total Panchayats</p>
                        <p className="text-3xl font-bold text-[#FF9933]">{analytics.totalPanchayats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666]">Total Users</p>
                        <p className="text-3xl font-bold text-[#138808]">{analytics.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666]">Total Posts</p>
                        <p className="text-3xl font-bold text-[#FF9933]">{analytics.totalPosts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666]">Total Schemes</p>
                        <p className="text-3xl font-bold text-[#138808]">{analytics.totalSchemes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "audit-logs" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B2B5E]">Audit Logs</h2>
                  <p className="text-sm sm:text-base text-[#666] mt-1">System-wide activity logs</p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile: Card View */}
                    <div className="block sm:hidden space-y-3">
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-8 text-[#666] text-sm">No audit logs found</div>
                      ) : (
                        auditLogs.map((log) => (
                          <Card key={log.id}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-sm">{log.userName}</h3>
                                  <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>Resource: {log.resource}</div>
                                  {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                                  <div>Time: {formatTimeAgo(log.createdAt)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.userName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.action}</Badge>
                              </TableCell>
                              <TableCell>{log.resource}</TableCell>
                              <TableCell>{log.ipAddress || "N/A"}</TableCell>
                              <TableCell>{formatTimeAgo(log.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Panchayat Create/Edit Dialog */}
      <Dialog open={isPanchayatDialogOpen} onOpenChange={setIsPanchayatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingPanchayat ? "Edit Panchayat" : "Create New Panchayat"}
            </DialogTitle>
            <DialogDescription>
              {editingPanchayat
                ? "Update panchayat information below"
                : "Enter the panchayat details to create a new panchayat"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="panchayatName">Panchayat Name *</Label>
              <Input
                id="panchayatName"
                placeholder="Enter panchayat name"
                value={panchayatFormData.panchayatName}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, panchayatName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain/Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., ramnagar"
                value={panchayatFormData.slug}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  placeholder="Enter district"
                  value={panchayatFormData.district}
                  onChange={(e) => setPanchayatFormData({ ...panchayatFormData, district: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="Enter state"
                  value={panchayatFormData.state}
                  onChange={(e) => setPanchayatFormData({ ...panchayatFormData, state: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter panchayat address"
                value={panchayatFormData.address}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="10-digit phone number"
                  value={panchayatFormData.contactPhone}
                  onChange={(e) => setPanchayatFormData({ ...panchayatFormData, contactPhone: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@example.com"
                  value={panchayatFormData.contactEmail}
                  onChange={(e) => setPanchayatFormData({ ...panchayatFormData, contactEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter panchayat description"
                value={panchayatFormData.description}
                onChange={(e) => setPanchayatFormData({ ...panchayatFormData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closePanchayatDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={editingPanchayat ? handleUpdatePanchayat : handleCreatePanchayat}
            >
              {editingPanchayat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

