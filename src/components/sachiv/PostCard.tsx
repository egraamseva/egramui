import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreVertical, Play } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ImageModal } from "../ui/image-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Post } from "../../types";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, showActions = false, onEdit, onDelete }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleImageClick = (index: number) => {
    // Only open modal for images, not videos
    const imageItems = post.media?.filter((item) => item.type === "image") || [];
    if (imageItems.length > 0) {
      setSelectedImageIndex(index);
      setIsImageModalOpen(true);
    }
  };

  const imageUrls = post.media?.filter((item) => item.type === "image").map((item) => item.url) || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933]">
                {post.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4>{post.author}</h4>
              <p className="text-sm text-muted-foreground">
                {post.authorRole} • {post.timestamp}
              </p>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(post.id)}
                  className="text-destructive"
                >
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <div
            className={`grid gap-1 ${
              post.media.length === 1
                ? "grid-cols-1"
                : post.media.length === 2
                ? "grid-cols-2"
                : post.media.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            }`}
          >
            {post.media.slice(0, 4).map((item, index) => {
              const imageIndex = post.media!.slice(0, index).filter((i) => i.type === "image").length;
              return (
                <div
                  key={index}
                  className={`relative aspect-square overflow-hidden bg-muted ${
                    post.media!.length === 1 ? "aspect-video" : ""
                  } ${post.media!.length > 4 && index === 3 ? "relative" : ""} ${
                    item.type === "image" ? "cursor-pointer" : ""
                  }`}
                  onClick={() => item.type === "image" && handleImageClick(imageIndex)}
                >
                  {item.type === "image" ? (
                    <>
                      <ImageWithFallback
                        src={item.url}
                        alt={`Post media ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {post.media!.length > 4 && index === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                          <span style={{ fontSize: "1.5rem" }}>+{post.media!.length - 4}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative h-full w-full">
                      <ImageWithFallback
                        src={item.thumbnail || item.url}
                        alt={`Video thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                        data-post-id={post.id}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
                          <Play className="h-8 w-8 text-[#FF9933]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF9933]">
              <Heart className="h-3 w-3 fill-white text-white" />
            </div>
            <span>{likesCount}</span>
          </div>
          <div className="flex gap-4">
            <span>{post.comments} comments</span>
            <span>{post.shares} shares</span>
          </div>
        </div>

        <Separator />

        {/* Post Actions */}
        <div className="grid grid-cols-3 p-2">
          <Button
            variant="ghost"
            className={`flex items-center gap-2 ${isLiked ? "text-[#FF9933]" : ""}`}
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            <span>Like</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>

      {/* Image Modal */}
      {imageUrls.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={imageUrls[selectedImageIndex] || imageUrls[0]}
          alt={`Post image ${selectedImageIndex + 1}`}
          images={imageUrls.length > 1 ? imageUrls : undefined}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
        />
      )}
    </Card>
  );
}