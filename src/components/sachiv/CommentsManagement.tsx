/**
 * Comments Management Component
 * Approve/reject comments on posts
 */

import { useState, useEffect } from "react";
import { Check, X, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { commentsAPI, postsAPI } from "../../services/api";
import type { Comment, Post } from "../../types";
import { formatTimeAgo } from "../../utils/format";

interface CommentsManagementProps {
  panchayatId: string;
}

export function CommentsManagement({ panchayatId }: CommentsManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchPosts();
  }, [panchayatId]);

  useEffect(() => {
    if (selectedPostId) {
      fetchComments(selectedPostId);
    }
  }, [selectedPostId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await postsAPI.getAll(panchayatId);
      setPosts(data);
      if (data.length > 0 && !selectedPostId) {
        setSelectedPostId(data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const data = await commentsAPI.getByPost(postId);
      setComments(data);
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  const handleApprove = async (postId: string, commentId: string) => {
    try {
      await commentsAPI.approve(postId, commentId);
      toast.success("Comment approved");
      fetchComments(postId);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to approve comment");
    }
  };

  const handleDelete = async (postId: string, commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await commentsAPI.delete(postId, commentId);
      toast.success("Comment deleted");
      fetchComments(postId);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const pendingComments = comments.filter((c) => c.status === "pending");
  const approvedComments = comments.filter((c) => c.status === "approved");
  const rejectedComments = comments.filter((c) => c.status === "rejected");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2B5E]">Comments Management</h2>
        <p className="text-[#666] mt-1">Review and moderate comments on posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>Select a post to view comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPostId === post.id
                      ? "border-[#FF9933] bg-[#FF9933]/10"
                      : "border-[#E5E5E5] hover:border-[#E31E24]"
                  }`}
                >
                  <p className="font-medium text-sm line-clamp-2">{post.content.substring(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#666]">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>
              {selectedPostId
                ? `Comments for selected post (${comments.length} total)`
                : "Select a post to view comments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPostId ? (
              <div className="text-center py-12 text-[#666]">
                Select a post from the left to view comments
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({pendingComments.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedComments.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedComments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingComments.length === 0 ? (
                    <div className="text-center py-8 text-[#666]">No pending comments</div>
                  ) : (
                    pendingComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#FF9933] flex items-center justify-center text-white font-semibold">
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{comment.author}</p>
                              {comment.authorEmail && (
                                <p className="text-sm text-[#666]">{comment.authorEmail}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-[#1a1a1a]">{comment.content}</p>
                        <div className="flex items-center justify-between text-sm text-[#666]">
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(comment.postId, comment.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(comment.postId, comment.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4 mt-4">
                  {approvedComments.length === 0 ? (
                    <div className="text-center py-8 text-[#666]">No approved comments</div>
                  ) : (
                    approvedComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#138808] flex items-center justify-center text-white font-semibold">
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{comment.author}</p>
                              {comment.authorEmail && (
                                <p className="text-sm text-[#666]">{comment.authorEmail}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="default">
                            <Check className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <p className="text-[#1a1a1a]">{comment.content}</p>
                        <div className="flex items-center justify-between text-sm text-[#666]">
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleDelete(comment.postId, comment.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4 mt-4">
                  {rejectedComments.length === 0 ? (
                    <div className="text-center py-8 text-[#666]">No rejected comments</div>
                  ) : (
                    rejectedComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-3 opacity-60">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#666] flex items-center justify-center text-white font-semibold">
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{comment.author}</p>
                              {comment.authorEmail && (
                                <p className="text-sm text-[#666]">{comment.authorEmail}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            <X className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-[#1a1a1a]">{comment.content}</p>
                        <div className="text-sm text-[#666]">
                          {formatTimeAgo(comment.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

