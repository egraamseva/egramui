import { useState } from "react";
import { ImageIcon, Video, X, Smile } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ImageModal } from "../ui/image-modal";
import type { PostMedia } from "../../types";
import { FILE_UPLOAD_LIMITS } from "../../constants";
import { validateFileSize, validateFileType } from "../../utils/validation";
import { toast } from "sonner";

interface CreatePostProps {
  authorName: string;
  authorRole: string;
  onSubmit?: (post: {
    content: string;
    media: PostMedia[];
  }) => void;
}

export function CreatePost({ authorName, authorRole, onSubmit }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<PostMedia[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: PostMedia[] = [];
    Array.from(files).forEach((file) => {
      // Validate file type
      const acceptedTypes = file.type.startsWith("video/")
        ? [".mp4", ".mov", ".avi"]
        : [...FILE_UPLOAD_LIMITS.ACCEPTED_IMAGE_TYPES];
      
      if (!validateFileType(file, acceptedTypes)) {
        toast.error(`Invalid file type: ${file.name}`);
        return;
      }

      // Validate file size
      const maxSize = file.type.startsWith("video/")
        ? 10 * 1024 * 1024 // 10MB for videos
        : FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE;
      
      if (!validateFileSize(file, maxSize)) {
        toast.error(`File too large: ${file.name}. Max size: ${maxSize / 1024 / 1024}MB`);
        return;
      }

      newMedia.push({
        type: (file.type.startsWith("video/") ? "video" : "image") as "image" | "video",
        url: URL.createObjectURL(file),
        file,
      });
    });

    if (newMedia.length > 0) {
      setMediaFiles([...mediaFiles, ...newMedia]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = [...mediaFiles];
    URL.revokeObjectURL(newMedia[index].url);
    newMedia.splice(index, 1);
    setMediaFiles(newMedia);
  };

  const handleSubmit = () => {
    if (content.trim() || mediaFiles.length > 0) {
      onSubmit?.({ content, media: mediaFiles });
      setContent("");
      mediaFiles.forEach((media) => URL.revokeObjectURL(media.url));
      setMediaFiles([]);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933]">
              {authorName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4>{authorName}</h4>
            <p className="text-sm text-muted-foreground">{authorRole}</p>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-4">
          <Textarea
            placeholder="What's happening in your Panchayat? Share updates, announcements, or achievements..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none border-0 p-0 focus-visible:ring-0"
          />
        </div>

        {/* Media Preview */}
        {mediaFiles.length > 0 && (
          <div className="mb-4">
            <div
              className={`grid gap-2 ${
                mediaFiles.length === 1
                  ? "grid-cols-1"
                  : mediaFiles.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {mediaFiles.map((media, index) => {
                const imageIndex = mediaFiles.slice(0, index).filter((m) => m.type === "image").length;
                return (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    {media.type === "image" ? (
                      <div
                        className="h-full w-full cursor-pointer"
                        onClick={() => {
                          setSelectedImageIndex(imageIndex);
                          setIsImageModalOpen(true);
                        }}
                      >
                        <ImageWithFallback
                          src={media.url}
                          alt={`Upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                    <div className="relative h-full w-full">
                      <video src={media.url} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Label htmlFor="photo-upload">
              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
                <ImageIcon className="h-5 w-5 text-[#138808]" />
                <span className="text-sm">Photo</span>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </Label>

            <Label htmlFor="video-upload">
              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
                <Video className="h-5 w-5 text-[#FF9933]" />
                <span className="text-sm">Video</span>
              </div>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </Label>

            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() && mediaFiles.length === 0}
            className="bg-[#FF9933] hover:bg-[#FF9933]/90"
          >
            Post
          </Button>
        </div>
      </CardContent>

      {/* Image Modal */}
      {mediaFiles.filter(m => m.type === "image").length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={mediaFiles.filter(m => m.type === "image")[selectedImageIndex]?.url || ""}
          alt={`Upload ${selectedImageIndex + 1}`}
          images={mediaFiles.filter(m => m.type === "image").map(m => m.url)}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
        />
      )}
    </Card>
  );
}