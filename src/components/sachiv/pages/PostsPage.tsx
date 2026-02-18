/**
 * Posts Page Component
 * Manage and create community posts
 */

import { useState, useEffect } from "react";
import { CreatePost } from "../CreatePost";
import { PostCard } from "../PostCard";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import type { Post } from "../../../types";
import { formatTimeAgo } from "../../../utils/format";
import { postApi, analyticsAdapter } from "@/routes/api";

export function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.panchayatId) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      // Backend returns only current panchayat's posts (filtered by tenant from JWT)
      const result = await postApi.list({ pageSize: 50 });
      setPosts(result.items);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: {
    content: string;
    media: { type: "image" | "video"; url: string; file?: File }[];
  }) => {
    if (!user) {
      toast.error("You need to be logged in to create posts.");
      return;
    }

    try {
      // Collect up to 4 image files from media (photos only for post API)
      const imageFiles = postData.media
        .filter((m) => m.type === "image" && m.file)
        .map((m) => m.file as File)
        .slice(0, 4);

      const newPost = await postApi.create({
        title: postData.content.slice(0, 60) || "Panchayat update",
        bodyText: postData.content || "Shared an update",
        ...(imageFiles.length > 0 ? { imageFiles } : {}),
      });
      setPosts((prev) => [newPost, ...prev]);
      if (user.panchayatId) {
        analyticsAdapter.invalidate(user.panchayatId);
      }
      toast.success("Post published successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post";
      toast.error(message);
    }
  };

  const handleEditPost = async (_id: string) => {
    toast.info("Edit post feature coming soon!");
  };

  const handleDeletePost = async (id: string) => {
    if (!user?.panchayatId) return;
    try {
      await postApi.delete(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      analyticsAdapter.invalidate(user.panchayatId);
      toast.success("Post deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      toast.error(message);
    }
  };

  return (
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

      {/* Posts List: PostCard shows single or multiple images (post.media) in a grid with lightbox */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Your Posts</h3>
        {loading ? (
          <div className="text-center text-muted-foreground py-8 text-sm">Loading posts...</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

