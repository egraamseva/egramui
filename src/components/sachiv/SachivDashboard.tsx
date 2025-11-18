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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { postsAPI, schemesAPI, announcementsAPI, analyticsAPI } from "../../services/api";
import type { Post, Scheme, Announcement } from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { TeamManagement } from "../admin/TeamManagement";
import { SettingsManagement } from "./SettingsManagement";
import { DocumentsManagement } from "./DocumentsManagement";
import { CommentsManagement } from "./CommentsManagement";
import { GalleryAlbums } from "./GalleryAlbums";
import { EnhancedAnalytics } from "./EnhancedAnalytics";

export function SachivDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [posts, setPosts] = useState<Post[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeSchemes: 0,
    announcements: 0,
    photoGallery: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.panchayatId) {
      fetchDashboardData();
    }
  }, [user]);

  // Close mobile menu when section changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeSection]);

  const fetchDashboardData = async () => {
    if (!user?.panchayatId) return;
    
    setLoading(true);
    try {
      const [postsData, schemesData, announcementsData, statsData] = await Promise.all([
        postsAPI.getAll(user.panchayatId),
        schemesAPI.getAll(user.panchayatId),
        announcementsAPI.getAll(user.panchayatId),
        analyticsAPI.getStats(user.panchayatId),
      ]);

      setPosts(postsData);
      setSchemes(schemesData);
      setAnnouncements(announcementsData);
      setStats({
        totalVisitors: statsData.totalVisitors,
        activeSchemes: statsData.activeSchemes,
        announcements: statsData.announcements,
        photoGallery: statsData.photoGallery,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    { label: "Total Visitors", value: stats.totalVisitors.toLocaleString(), change: "+12.5%", icon: Users, color: "#FF9933" },
    { label: "Active Schemes", value: stats.activeSchemes.toString(), change: "+2", icon: FileText, color: "#138808" },
    { label: "Announcements", value: stats.announcements.toString(), change: "+5", icon: TrendingUp, color: "#FF9933" },
    { label: "Photo Gallery", value: stats.photoGallery.toString(), change: "+18", icon: ImageIcon, color: "#138808" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "posts", label: "Posts", icon: Megaphone },
    { id: "announcements", label: "Announcements", icon: FileText },
    { id: "schemes", label: "Schemes", icon: Users },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "albums", label: "Albums", icon: ImageIcon },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "team", label: "Team", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleCreatePost = async (postData: {
    content: string;
    media: { type: "image" | "video"; url: string; file?: File }[];
  }) => {
    if (!user?.panchayatId) return;
    
    try {
      const newPost = await postsAPI.create({
        title: postData.content.substring(0, 100), // Use first 100 chars as title
        bodyText: postData.content,
        mediaUrl: postData.media?.[0]?.url,
      });
      setPosts([newPost, ...posts]);
      toast.success("Post published successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post";
      toast.error(message);
    }
  };

  const handleEditPost = (_id: string) => {
    toast.info("Edit post feature coming soon!");
  };

  const handleDeletePost = async (id: string) => {
    try {
      await postsAPI.delete(id);
      setPosts(posts.filter((post) => post.id !== id));
      toast.success("Post deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      toast.error(message);
    }
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
            <h3 className="text-sm font-semibold text-[#1B2B5E]">Ramnagar GP</h3>
            <p className="text-xs text-[#666]">
              Sachiv Dashboard
            </p>
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
              <h3 className="text-sm font-semibold text-[#1B2B5E]">Ramnagar GP</h3>
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
              {/* Stats Grid */}
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading dashboard...</div>
              ) : (
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
              )}

              {/* Recent Activity */}
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
                        schemes.map((scheme) => (
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
            </div>
          )}

          {/* Posts View */}
          {activeSection === "posts" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-2 sm:gap-0 sm:items-center sm:justify-between sm:flex-row">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Community Posts</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Share updates, photos, and videos with your community
                  </p>
                </div>
              </div>

              {/* Create Post Section */}
              <CreatePost
                authorName={user?.name || "User"}
                authorRole={user?.role || "Sachiv"}
                onSubmit={handleCreatePost}
              />

              {/* Posts List */}
              <div>
                <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Your Posts</h3>
                <div className="space-y-4 sm:space-y-6">
                      {posts.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 text-sm">
                          No posts yet. Create your first post!
                        </div>
                      ) : (
                        posts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={{
                              ...post,
                              timestamp: formatTimeAgo(new Date(post.timestamp)),
                            }}
                            showActions={true}
                            onEdit={handleEditPost}
                            onDelete={handleDeletePost}
                          />
                        ))
                      )}
                </div>
              </div>
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
                <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">New Announcement</span>
                </Button>
              </div>

              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="published" className="text-xs sm:text-sm">Published</TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs sm:text-sm">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4 sm:mt-6">
                  {/* Mobile: Card View */}
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
                                <Button variant="outline" size="sm" className="flex-1 text-destructive">
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

                  {/* Desktop: Table View */}
                  <Card className="hidden sm:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {announcements.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                No announcements yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            announcements.map((announcement) => (
                              <TableRow key={announcement.id}>
                                <TableCell className="font-medium">{announcement.title}</TableCell>
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
                                    <Button variant="ghost" size="icon">
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
                <Button className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">Add Scheme</span>
                </Button>
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
                            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
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
                <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">Upload Photos</span>
                </Button>
              </div>

              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                      <div
                        key={item}
                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FF9933]/20 to-[#138808]/20">
                          <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                          <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-9 sm:w-9">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-9 sm:w-9">
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Albums View */}
          {activeSection === "albums" && user?.panchayatId && (
            <GalleryAlbums panchayatId={user.panchayatId} />
          )}

          {/* Documents View */}
          {activeSection === "documents" && user?.panchayatId && (
            <DocumentsManagement panchayatId={user.panchayatId} />
          )}

          {/* Comments View */}
          {activeSection === "comments" && user?.panchayatId && (
            <CommentsManagement panchayatId={user.panchayatId} />
          )}

          {/* Team View */}
          {activeSection === "team" && user?.panchayatId && (
            <TeamManagement panchayatId={user.panchayatId} />
          )}

          {/* Enhanced Analytics View */}
          {activeSection === "analytics" && user?.panchayatId && (
            <EnhancedAnalytics panchayatId={user.panchayatId} />
          )}

          {/* Settings View */}
          {activeSection === "settings" && user?.panchayatId && (
            <SettingsManagement panchayatId={user.panchayatId} />
          )}
        </main>
      </div>
    </div>
  );
}