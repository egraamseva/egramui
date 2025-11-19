/**
 * Dashboard Page Component
 * Main overview page with statistics and recent activity
 */

import { useState, useEffect } from "react";
import { Users, FileText, ImageIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import type { Post, Scheme, Announcement } from "../../../types";
import { postApi, analyticsAdapter } from "@/routes/api";

export function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  console.log("Posts:", posts);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeSchemes: 0,
    announcements: 0,
    photoGallery: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.panchayatId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      const [postsResult, analyticsData] = await Promise.all([
        postApi.list({ pageSize: 50 }),
        analyticsAdapter.getOverview(user.panchayatId),
      ]);

      setPosts(postsResult.items);
      setSchemes([]); // TODO: Fetch from schemes API when available
      setAnnouncements([]); // TODO: Fetch from announcements API when available
      setStats({
        totalVisitors: analyticsData.totalVisitors,
        activeSchemes: analyticsData.activeSchemes,
        announcements: analyticsData.announcements,
        photoGallery: analyticsData.photoGallery,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      label: "Total Visitors",
      value: stats.totalVisitors.toLocaleString(),
      change: "+12.5%",
      icon: Users,
      color: "#FF9933",
    },
    {
      label: "Active Schemes",
      value: stats.activeSchemes.toString(),
      change: "+2",
      icon: FileText,
      color: "#138808",
    },
    {
      label: "Announcements",
      value: stats.announcements.toString(),
      change: "+5",
      icon: TrendingUp,
      color: "#FF9933",
    },
    {
      label: "Photo Gallery",
      value: stats.photoGallery.toString(),
      change: "+18",
      icon: ImageIcon,
      color: "#138808",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading dashboard...</div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {stat.label}
                      </p>
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
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Announcements</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Latest updates posted to your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No announcements yet
                </div>
              ) : (
                announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 sm:pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base truncate">{announcement.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {announcement.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={announcement.status === "Published" ? "default" : "secondary"}
                        className={`text-xs ${
                          announcement.status === "Published" ? "bg-[#138808]" : ""
                        }`}
                      >
                        {announcement.status}
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {announcement.views || 0} views
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
            <CardDescription className="text-xs sm:text-sm">
              Track implementation of active schemes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {schemes.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No schemes yet
                </div>
              ) : (
                schemes.map((scheme) => (
                  <div key={scheme.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm sm:text-base truncate flex-1">{scheme.name}</p>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {scheme.progress}%
                      </span>
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
  );
}

