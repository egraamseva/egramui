/**
 * Enhanced Analytics Component
 * Detailed analytics with charts and metrics
 */

import { useState, useEffect } from "react";
import { Eye, Heart, MessageSquare, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import type { AnalyticsOverview, PageView, PopularPost, EngagementStats } from "../../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { analyticsAdapter } from "@/routes/api";

interface EnhancedAnalyticsProps {
  panchayatId: string;
  refreshKey?: number;
}

export function EnhancedAnalytics({ panchayatId, refreshKey = 0 }: EnhancedAnalyticsProps) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [engagement, setEngagement] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!panchayatId) return;
    analyticsAdapter.invalidate(panchayatId);
    fetchAnalytics(panchayatId);
  }, [panchayatId, refreshKey]);

  const fetchAnalytics = async (id: string) => {
    setLoading(true);
    try {
      const [overviewData, pageViewsData, popularPostsData, engagementData] = await Promise.all([
        analyticsAdapter.getOverview(id),
        analyticsAdapter.getPageViews(id),
        analyticsAdapter.getPopularPosts(id),
        analyticsAdapter.getEngagement(id),
      ]);

      setOverview(overviewData);
      setPageViews(pageViewsData);
      setPopularPosts(popularPostsData);
      setEngagement(engagementData);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overview || !engagement) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const chartData = pageViews.map((pv) => ({
    date: new Date(pv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: pv.views,
    visitors: pv.uniqueVisitors,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B2B5E]">Analytics Dashboard</h2>
        <p className="text-sm sm:text-base text-[#666] mt-1">Detailed insights into your panchayat website performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#666]">Total Visitors</CardTitle>
            <Eye className="h-5 w-5 text-[#FF9933]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{overview.totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#666]">Total Posts</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#138808]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-[#138808]">{overview.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#666]">Total Comments</CardTitle>
            <MessageSquare className="h-5 w-5 text-[#FF9933]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-[#FF9933]">{overview.totalComments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#666]">Total Likes</CardTitle>
            <Heart className="h-5 w-5 text-[#138808]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-[#138808]">{overview.totalLikes}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="page-views" className="w-full">
        <TabsList>
          <TabsTrigger value="page-views">Page Views</TabsTrigger>
          <TabsTrigger value="popular-posts">Popular Posts</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="page-views" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
              <CardDescription>Last 30 days visitor statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#FF9933" strokeWidth={2} />
                  <Line type="monotone" dataKey="visitors" stroke="#138808" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular-posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Posts</CardTitle>
              <CardDescription>Top performing posts by views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#FF9933] flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[#666]">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[#666]">Total Likes</p>
                  <p className="text-2xl font-bold text-[#FF9933]">{engagement.totalLikes}</p>
                </div>
                <div>
                  <p className="text-sm text-[#666]">Total Comments</p>
                  <p className="text-2xl font-bold text-[#138808]">{engagement.totalComments}</p>
                </div>
                <div>
                  <p className="text-sm text-[#666]">Total Shares</p>
                  <p className="text-2xl font-bold text-[#FF9933]">{engagement.totalShares}</p>
                </div>
                <div>
                  <p className="text-sm text-[#666]">Average Engagement</p>
                  <p className="text-2xl font-bold text-[#138808]">
                    {Math.round(engagement.averageEngagement)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Engaged Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagement.topEngagedPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#666]">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
