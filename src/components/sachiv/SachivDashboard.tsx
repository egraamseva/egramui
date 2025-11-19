import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  ImageIcon,
  Settings,
  BarChart3,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Megaphone,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Upload,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// import { postsAPI } from "@/services/api";

// Import APIs
import {
  postsAPI,
  announcementsAPI,
  schemesAPI,
  galleryAPI,
  albumsAPI,
  commentsAPI,
  teamAPI,
  documentsAPI,
  settingsAPI,
  analyticsAPI,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

// Mock user and auth context
// const mockUser = {
//   panchayatId: "1",
//   name: "Sachiv Kumar",
//   email: "sachiv@panchayat.gov.in",
//   role: "Sachiv",
//   panchayatName: "Ramnagar"
// };

export default function SachivDashboard() {
  const navigate = useNavigate();
  const {user} = useAuth(); // Replace with useAuth() in production
  
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data states
  const [posts, setPosts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [stats, setStats] = useState<any>({});

  // Dialog states
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [schemeDialog, setSchemeDialog] = useState(false);
  const [albumDialog, setAlbumDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: "",
    id: ""
  });

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    category: "General",
    status: "Published"
  });
  const [schemeForm, setSchemeForm] = useState({
    name: "",
    category: "Housing",
    budget: "",
    beneficiaries: "",
    startDate: "",
    endDate: ""
  });
  const [albumForm, setAlbumForm] = useState({ name: "", description: "" });
  const [teamForm, setTeamForm] = useState({
    name: "",
    email: "",
    role: "PANCHAYAT_MEMBER",
    password: "",
    phone: "" // Add phone to form state
  });
  const [settingsForm, setSettingsForm] = useState<any>({});

  useEffect(() => {
    if (user?.panchayatId) {
      loadAllData();
    }
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeSection]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPosts(),
        loadAnnouncements(),
        loadSchemes(),
        loadGallery(),
        loadAlbums(),
        loadComments(),
        loadTeam(),
        loadDocuments(),
        loadSettings(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const result = await postsAPI.getAllPosts({ page: 0, size: 50 });
      setPosts(result.content);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const loadAnnouncements = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await announcementsAPI.getAll(user.panchayatId);
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const loadSchemes = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await schemesAPI.getAll(user.panchayatId);
      setSchemes(data);
    } catch (error) {
      console.error("Error loading schemes:", error);
    }
  };

  const loadGallery = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await galleryAPI.getAll(user.panchayatId);
      setGallery(data);
    } catch (error) {
      console.error("Error loading gallery:", error);
    }
  };

  const loadAlbums = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await albumsAPI.getAll(user.panchayatId);
      setAlbums(data);
    } catch (error) {
      console.error("Error loading albums:", error);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentsAPI.getAllComments();
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const loadTeam = async () => {
    try {
      const result = await teamAPI.getTeamMembers();
      setTeam(result.content);
    } catch (error) {
      console.error("Error loading team:", error);
    }
  };

  const loadDocuments = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await documentsAPI.getAll(user.panchayatId);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const loadSettings = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await settingsAPI.get(user.panchayatId);
      setSettings(data);
      setSettingsForm(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadAnalytics = async () => {
    if (!user?.panchayatId) return;
    try {
      const data = await analyticsAPI.getOverview(user.panchayatId);
      setStats(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  // Announcement handlers
  const handleCreateAnnouncement = async () => {
    if (!user?.panchayatId) return;
    try {
      const newAnnouncement = await announcementsAPI.create(user.panchayatId, announcementForm);
      setAnnouncements([newAnnouncement, ...announcements]);
      setAnnouncementDialog(false);
      setAnnouncementForm({ title: "", content: "", category: "General", status: "Published" });
      alert("Announcement created successfully!");
    } catch (error) {
      alert("Error creating announcement");
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!user?.panchayatId) return;
    try {
      await announcementsAPI.delete(user.panchayatId, deleteDialog.id);
      setAnnouncements(announcements.filter(a => a.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Announcement deleted successfully!");
    } catch (error) {
      alert("Error deleting announcement");
    }
  };

  // Scheme handlers
  const handleCreateScheme = async () => {
    if (!user?.panchayatId) return;
    try {
      const newScheme = await schemesAPI.create(user.panchayatId, schemeForm);
      setSchemes([newScheme, ...schemes]);
      setSchemeDialog(false);
      setSchemeForm({ name: "", category: "Housing", budget: "", beneficiaries: "", startDate: "", endDate: "" });
      alert("Scheme created successfully!");
    } catch (error) {
      alert("Error creating scheme");
    }
  };

  const handleDeleteScheme = async () => {
    if (!user?.panchayatId) return;
    try {
      await schemesAPI.delete(user.panchayatId, deleteDialog.id);
      setSchemes(schemes.filter(s => s.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Scheme deleted successfully!");
    } catch (error) {
      alert("Error deleting scheme");
    }
  };

  // Gallery handlers
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.panchayatId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const newItem = await galleryAPI.upload(user.panchayatId, files[i], {
          title: files[i].name,
          category: "General"
        });
        setGallery(prev => [newItem, ...prev]);
      }
      alert("Photos uploaded successfully!");
    } catch (error) {
      alert("Error uploading photos");
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.panchayatId) return;
    try {
      await galleryAPI.delete(user.panchayatId, deleteDialog.id);
      setGallery(gallery.filter(g => g.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Photo deleted successfully!");
    } catch (error) {
      alert("Error deleting photo");
    }
  };

  // Album handlers
  const handleCreateAlbum = async () => {
    if (!user?.panchayatId) return;
    try {
      const newAlbum = await albumsAPI.create(user.panchayatId, albumForm);
      setAlbums([newAlbum, ...albums]);
      setAlbumDialog(false);
      setAlbumForm({ name: "", description: "" });
      alert("Album created successfully!");
    } catch (error) {
      alert("Error creating album");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!user?.panchayatId) return;
    try {
      await albumsAPI.delete(user.panchayatId, deleteDialog.id);
      setAlbums(albums.filter(a => a.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Album deleted successfully!");
    } catch (error) {
      alert("Error deleting album");
    }
  };

  // Comment handlers
  const handleApproveComment = async (postId: string, commentId: string) => {
    try {
      await commentsAPI.approveComment(parseInt(postId), parseInt(commentId));
      await loadComments();
      alert("Comment approved!");
    } catch (error) {
      alert("Error approving comment");
    }
  };

  const handleDeleteComment = async () => {
    try {
      const comment = comments.find(c => c.commentId.toString() === deleteDialog.id);
      if (comment) {
        await commentsAPI.deleteComment(comment.postId, comment.commentId);
        setComments(comments.filter(c => c.commentId.toString() !== deleteDialog.id));
        setDeleteDialog({ open: false, type: "", id: "" });
        alert("Comment deleted successfully!");
      }
    } catch (error) {
      alert("Error deleting comment");
    }
  };

  // Team handlers
  const handleAddTeamMember = async () => {
    try {
      const newMember = await teamAPI.addTeamMember(teamForm);
      await loadTeam();
      setTeamDialog(false);
      setTeamForm({ name: "", email: "", role: "PANCHAYAT_MEMBER", password: "", phone: "" });
      alert("Team member added successfully!");
    } catch (error) {
      alert("Error adding team member");
    }
  };

  const handleRemoveTeamMember = async () => {
    try {
      await teamAPI.removeTeamMember(parseInt(deleteDialog.id));
      setTeam(team.filter(t => t.userId.toString() !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Team member removed successfully!");
    } catch (error) {
      alert("Error removing team member");
    }
  };

  // Document handlers
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.panchayatId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const newDoc = await documentsAPI.upload(user.panchayatId, files[i], {
          category: "General"
        });
        setDocuments(prev => [newDoc, ...prev]);
      }
      setUploadDialog(false);
      alert("Documents uploaded successfully!");
    } catch (error) {
      alert("Error uploading documents");
    }
  };

  const handleDeleteDocument = async () => {
    if (!user?.panchayatId) return;
    try {
      await documentsAPI.delete(user.panchayatId, deleteDialog.id);
      setDocuments(documents.filter(d => d.id !== deleteDialog.id));
      setDeleteDialog({ open: false, type: "", id: "" });
      alert("Document deleted successfully!");
    } catch (error) {
      alert("Error deleting document");
    }
  };

  // Settings handlers
  const handleUpdateSettings = async () => {
    if (!user?.panchayatId) return;
    try {
      const updated = await settingsAPI.update(user.panchayatId, settingsForm);
      setSettings(updated);
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Error updating settings");
    }
  };

  const handleDelete = () => {
    switch (deleteDialog.type) {
      case "announcement":
        handleDeleteAnnouncement();
        break;
      case "scheme":
        handleDeleteScheme();
        break;
      case "photo":
        handleDeletePhoto();
        break;
      case "album":
        handleDeleteAlbum();
        break;
      case "comment":
        handleDeleteComment();
        break;
      case "team":
        handleRemoveTeamMember();
        break;
      case "document":
        handleDeleteDocument();
        break;
    }
  };

  const dashboardStats = [
    {
      label: "Total Visitors",
      value: stats.totalVisitors?.toLocaleString() || "0",
      change: "+12.5%",
      icon: Users,
      color: "#FF9933"
    },
    {
      label: "Active Schemes",
      value: stats.activeSchemes?.toString() || "0",
      change: "+2",
      icon: FileText,
      color: "#138808"
    },
    {
      label: "Announcements",
      value: stats.announcements?.toString() || "0",
      change: "+5",
      icon: TrendingUp,
      color: "#FF9933"
    },
    {
      label: "Photo Gallery",
      value: stats.photoGallery?.toString() || "0",
      change: "+18",
      icon: ImageIcon,
      color: "#138808"
    },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "posts", label: "Posts", icon: Megaphone },
    { id: "announcements", label: "Announcements", icon: FileText },
    { id: "schemes", label: "Schemes", icon: Target },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "albums", label: "Albums", icon: ImageIcon },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "team", label: "Team", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
            <h3 className="text-sm font-semibold text-[#1B2B5E]">{user?.panchayatName || 'Panchayat'} GP</h3>
            <p className="text-xs text-[#666]">Sachiv Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-[#E31E24] text-white font-medium shadow-sm"
                  : "text-[#666] hover:bg-[#F5F5F5] hover:text-[#1B2B5E]"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
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
              <h3 className="text-sm font-semibold text-[#1B2B5E]">{user?.panchayatName} GP</h3>
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
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-[#E31E24] text-white font-medium shadow-sm"
                  : "text-[#666] hover:bg-[#F5F5F5] hover:text-[#1B2B5E]"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
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
                Welcome back, {user?.name || 'User'}
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
              onClick={() => navigate(`/panchayat/${user?.panchayatName?.toLowerCase() || 'demo'}`)}
              className="hidden sm:inline-flex"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Website
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/panchayat/${user?.panchayatName?.toLowerCase() || 'demo'}`)}
              className="sm:hidden"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/login")}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Avatar className="hidden sm:flex">
              <AvatarFallback className="bg-primary text-white">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-3 sm:p-4 md:p-6">
          {/* Dashboard View */}
          {activeSection === "dashboard" && (
            <div className="space-y-4 sm:space-y-6">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading dashboard...</div>
              ) : (
                <>
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {dashboardStats.map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                              <p className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold">
                                {stat.value}
                              </p>
                              <p className="mt-1 text-xs sm:text-sm" style={{ color: stat.color }}>
                                {stat.change}
                              </p>
                            </div>
                            <div
                              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg flex-shrink-0 ml-2"
                              style={{ backgroundColor: `${stat.color}15` }}
                            >
                              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stat.color }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Recent Announcements</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Latest updates posted to your website</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {announcements.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4 text-sm">No announcements yet</div>
                          ) : (
                            announcements.slice(0, 3).map((announcement) => (
                              <div key={announcement.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 sm:pb-4 last:border-0 last:pb-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm sm:text-base truncate">{announcement.title}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{announcement.date}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge
                                    variant={announcement.status === "Published" ? "default" : "secondary"}
                                    className={`text-xs ${announcement.status === "Published" ? "bg-[#138808]" : ""}`}
                                  >
                                    {announcement.status}
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                    {announcement.views} views
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Scheme Progress</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Track implementation of active schemes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                          {schemes.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4 text-sm">No schemes yet</div>
                          ) : (
                            schemes.slice(0, 3).map((scheme) => (
                              <div key={scheme.id} className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm sm:text-base truncate flex-1">{scheme.name}</p>
                                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{scheme.progress}%</span>
                                </div>
                                <Progress value={scheme.progress} />
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Posts View - Use existing CreatePost and PostCard components */}
          {activeSection === "posts" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-2 sm:gap-0 sm:items-center sm:justify-between sm:flex-row">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Posts</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage your posts ({posts.length} total)
                  </p>
                </div>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    Posts are managed through the Posts component. {posts.length} posts found.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Announcements View */}
          {activeSection === "announcements" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Announcements</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage your panchayat announcements</p>
                </div>
                <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">New Announcement</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                      <DialogDescription>Add a new announcement to your panchayat website</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="Enter announcement title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          placeholder="Enter announcement content"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={announcementForm.category} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={announcementForm.status} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Published">Published</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAnnouncementDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateAnnouncement} className="bg-[#FF9933] hover:bg-[#FF9933]/90">Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="published" className="text-xs sm:text-sm">Published</TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs sm:text-sm">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4 sm:mt-6">
                  <Card className="hidden sm:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {announcements.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                No announcements yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            announcements.map((announcement) => (
                              <TableRow key={announcement.id}>
                                <TableCell className="font-medium">{announcement.title}</TableCell>
                                <TableCell>{announcement.category}</TableCell>
                                <TableCell>{announcement.date}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={announcement.status === "Published" ? "default" : "secondary"}
                                    className={announcement.status === "Published" ? "bg-[#138808]" : ""}
                                  >
                                    {announcement.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{announcement.views}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteDialog({ open: true, type: "announcement", id: announcement.id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <div className="block sm:hidden space-y-3">
                    {announcements.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center text-muted-foreground text-sm">
                          No announcements yet
                        </CardContent>
                      </Card>
                    ) : (
                      announcements.map((announcement) => (
                        <Card key={announcement.id}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-sm mb-1">{announcement.title}</h3>
                                <p className="text-xs text-muted-foreground">{announcement.date}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={announcement.status === "Published" ? "default" : "secondary"}
                                  className={`text-xs ${announcement.status === "Published" ? "bg-[#138808]" : ""}`}
                                >
                                  {announcement.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{announcement.views} views</span>
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Edit className="mr-2 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, type: "announcement", id: announcement.id })}
                                >
                                  <Trash2 className="mr-2 h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Schemes View */}
          {activeSection === "schemes" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Schemes Management</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Track and manage government schemes</p>
                </div>
                <Dialog open={schemeDialog} onOpenChange={setSchemeDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Add Scheme</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Scheme</DialogTitle>
                      <DialogDescription>Add a new government scheme to track</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="schemeName">Scheme Name</Label>
                        <Input
                          id="schemeName"
                          value={schemeForm.name}
                          onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                          placeholder="Enter scheme name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="schemeCategory">Category</Label>
                        <Select value={schemeForm.category} onValueChange={(value) => setSchemeForm({ ...schemeForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Housing">Housing</SelectItem>
                            <SelectItem value="Sanitation">Sanitation</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Agriculture">Agriculture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="budget">Budget</Label>
                        <Input
                          id="budget"
                          value={schemeForm.budget}
                          onChange={(e) => setSchemeForm({ ...schemeForm, budget: e.target.value })}
                          placeholder="₹50 Lakhs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="beneficiaries">Beneficiaries</Label>
                        <Input
                          id="beneficiaries"
                          type="number"
                          value={schemeForm.beneficiaries}
                          onChange={(e) => setSchemeForm({ ...schemeForm, beneficiaries: e.target.value })}
                          placeholder="120"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={schemeForm.startDate}
                            onChange={(e) => setSchemeForm({ ...schemeForm, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={schemeForm.endDate}
                            onChange={(e) => setSchemeForm({ ...schemeForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSchemeDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateScheme} className="bg-[#138808] hover:bg-[#138808]/90">Add Scheme</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {schemes.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      No schemes yet. Add your first scheme!
                    </CardContent>
                  </Card>
                ) : (
                  schemes.map((scheme) => (
                    <Card key={scheme.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg">{scheme.name}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Category: {scheme.category}</CardDescription>
                          </div>
                          <div className="flex gap-2 self-start sm:self-center">
                            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 sm:h-10 sm:w-10"
                              onClick={() => setDeleteDialog({ open: true, type: "scheme", id: scheme.id })}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">Budget</p>
                            <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">{scheme.budget}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</p>
                            <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">{scheme.beneficiaries} families</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">Progress</p>
                            <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">{scheme.progress}%</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Progress value={scheme.progress} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Gallery View */}
          {activeSection === "gallery" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Photo Gallery</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Upload and manage photos</p>
                </div>
                <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto" asChild>
                  <label>
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">Upload Photos</span>
                    <input type="file" multiple accept="image/*" onChange={handleUploadPhoto} className="hidden" />
                  </label>
                </Button>
              </div>

              <Card>
                <CardContent className="p-3 sm:p-6">
                  {gallery.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No photos yet. Upload your first photo!
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {gallery.map((item) => (
                        <div
                          key={item.id}
                          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                            <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-9 sm:w-9">
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 sm:h-9 sm:w-9"
                              onClick={() => setDeleteDialog({ open: true, type: "photo", id: item.id })}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Albums View */}
          {activeSection === "albums" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Photo Albums</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Organize photos into albums</p>
                </div>
                <Dialog open={albumDialog} onOpenChange={setAlbumDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Create Album</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Album</DialogTitle>
                      <DialogDescription>Create a new photo album</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="albumName">Album Name</Label>
                        <Input
                          id="albumName"
                          value={albumForm.name}
                          onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                          placeholder="Enter album name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="albumDesc">Description (Optional)</Label>
                        <Textarea
                          id="albumDesc"
                          value={albumForm.description}
                          onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                          placeholder="Enter album description"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAlbumDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateAlbum} className="bg-[#138808] hover:bg-[#138808]/90">Create Album</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {albums.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      No albums yet. Create your first album!
                    </CardContent>
                  </Card>
                ) : (
                  albums.map((album) => (
                    <Card key={album.id}>
                      <CardContent className="p-4">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                          <img src={album.cover} alt={album.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{album.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{album.photoCount} photos • {album.date}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive"
                            onClick={() => setDeleteDialog({ open: true, type: "album", id: album.id })}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Documents View */}
          {activeSection === "documents" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Documents</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage panchayat documents</p>
                </div>
                <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto">
                      <Upload className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Upload Documents</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Documents</DialogTitle>
                      <DialogDescription>Upload PDF or other document files</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="docFiles">Select Files</Label>
                        <Input
                          id="docFiles"
                          type="file"
                          multiple
                          onChange={handleUploadDocument}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUploadDialog(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            No documents yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell>{doc.category}</TableCell>
                            <TableCell>{doc.size}</TableCell>
                            <TableCell>{doc.uploadDate}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteDialog({ open: true, type: "document", id: doc.id })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* Comments View */}
          {activeSection === "comments" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Comments Management</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Moderate comments on your posts</p>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            No comments yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        comments.map((comment) => (
                          <TableRow key={comment.commentId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{comment.commenterName}</p>
                                <p className="text-xs text-muted-foreground">{comment.commenterEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{comment.bodyText}</TableCell>
                            <TableCell>{new Date(comment.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={comment.approvedFlag ? "default" : "secondary"}>
                                {comment.approvedFlag ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!comment.approvedFlag && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApproveComment(comment.postId.toString(), comment.commentId.toString())}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteDialog({ open: true, type: "comment", id: comment.commentId.toString() })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* Team View */}
          {activeSection === "team" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Team Management</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage panchayat team members</p>
                </div>
                <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Add Member</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>Add a new member to your panchayat team</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="memberName">Name</Label>
                        <Input
                          id="memberName"
                          value={teamForm.name}
                          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                          placeholder="Enter member name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberEmail">Email</Label>
                        <Input
                          id="memberEmail"
                          type="email"
                          value={teamForm.email}
                          onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberRole">Role</Label>
                        <Select value={teamForm.role} onValueChange={(value) => setTeamForm({ ...teamForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SARPANCH">Sarpanch</SelectItem>
                            <SelectItem value="SACHIV">Sachiv</SelectItem>
                            <SelectItem value="PANCHAYAT_MEMBER">Ward Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="memberPassword">Temporary Password</Label>
                        <Input
                          id="memberPassword"
                          type="text"
                          value={teamForm.password}
                          onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })}
                          placeholder="Set temporary password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberPhone">Phone (Optional)</Label>
                        <Input
                          id="memberPhone"
                          type="tel"
                          value={teamForm.phone}
                          onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTeamDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddTeamMember} className="bg-[#138808] hover:bg-[#138808]/90">Add Member</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No team members yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        team.map((member) => (
                          <TableRow key={member.userId}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.role}</TableCell>
                            <TableCell>
                              <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteDialog({ open: true, type: "team", id: member.userId.toString() })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* Analytics View */}
          {activeSection === "analytics" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Analytics Overview</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Monitor your panchayat's performance</p>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Posts</p>
                        <p className="mt-1 text-xl sm:text-2xl font-semibold">{stats.totalPosts || 0}</p>
                      </div>
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100">
                        <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Comments</p>
                        <p className="mt-1 text-xl sm:text-2xl font-semibold">{stats.totalComments || 0}</p>
                      </div>
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100">
                        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Likes</p>
                        <p className="mt-1 text-xl sm:text-2xl font-semibold">{stats.totalLikes || 0}</p>
                      </div>
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-red-100">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Gallery Items</p>
                        <p className="mt-1 text-xl sm:text-2xl font-semibold">{stats.photoGallery || 0}</p>
                      </div>
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100">
                        <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest interactions on your posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {posts.slice(0, 5).map((post) => (
                        <div key={post.postId} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.likesCount} likes • {post.commentsCount} comments
                            </p>
                          </div>
                        </div>
                      ))}
                      {posts.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">No activity yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Summary</CardTitle>
                    <CardDescription>Overview of your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Announcements</span>
                        <span className="text-sm font-semibold">{announcements.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Schemes</span>
                        <span className="text-sm font-semibold">{schemes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Albums</span>
                        <span className="text-sm font-semibold">{albums.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Documents</span>
                        <span className="text-sm font-semibold">{documents.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Team Members</span>
                        <span className="text-sm font-semibold">{team.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeSection === "settings" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your panchayat settings</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Update your panchayat information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="panchayatName">Panchayat Name</Label>
                    <Input
                      id="panchayatName"
                      value={settingsForm.panchayatName || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, panchayatName: e.target.value })}
                      placeholder="Enter panchayat name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={settingsForm.heroTitle || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                      placeholder="Welcome message"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Input
                      id="heroSubtitle"
                      value={settingsForm.heroSubtitle || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                      placeholder="Subtitle text"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aboutText">About Text</Label>
                    <Textarea
                      id="aboutText"
                      value={settingsForm.aboutText || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, aboutText: e.target.value })}
                      placeholder="About your panchayat"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settingsForm.contactEmail || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      placeholder="contact@panchayat.gov.in"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={settingsForm.contactPhone || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactAddress">Address</Label>
                    <Textarea
                      id="contactAddress"
                      value={settingsForm.contactAddress || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                      placeholder="Village Office, District"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="officeHours">Office Hours</Label>
                    <Input
                      id="officeHours"
                      value={settingsForm.officeHours || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, officeHours: e.target.value })}
                      placeholder="Mon-Fri: 9:00 AM - 5:00 PM"
                    />
                  </div>
                  <Button onClick={handleUpdateSettings} className="bg-[#138808] hover:bg-[#138808]/90">
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteDialog.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}