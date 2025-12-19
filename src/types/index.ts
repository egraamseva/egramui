/**
 * Shared TypeScript types and interfaces for the e-GramSeva application
 */

export type PageType =
  | "landing"
  | "registration"
  | "panchayat-demo"
  | "dashboard"
  | "success";

export type Language = "en" | "mr" | "hi" | "regional";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface Post {
  id: string;
  panchayatId?: string;
  author: string;
  authorRole: string;
  timestamp: string;
  content: string;
  media?: PostMedia[];
  likes: number;
  comments: number;
  shares: number;
}

export interface PostMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  file?: File;
}

export interface Scheme {
  id: string;
  panchayatId?: string;
  name: string;
  category: string;
  budget: string;
  beneficiaries: number;
  progress: number;
  status: "Active" | "Completed" | "Pending";
}

export interface PanchayatMember {
  id: string;
  panchayatId?: string;
  name: string;
  role: string;
  ward: string;
  phone: string;
  email?: string;
  image?: string;
  imageKey?: string;
  hasImage?: boolean;
  initials?: string;
  designation?: string;
}

export interface Announcement {
  id: string;
  panchayatId?: string;
  title: string;
  date: string;
  description?: string;
  status?: "Published" | "Draft";
  views?: number;
}

export interface GalleryItem {
  id: string;
  panchayatId?: string;
  title: string;
  image: string;
  description?: string;
  category?: string;
  date?: string;
}

export interface Project {
  id: string;
  panchayatId?: string;
  title: string;
  description: string;
  budget: string;
  timeline: string;
  status: "In Progress" | "Completed" | "Pending" | "Planned";
  progress: number;
  wards: string;
  startDate?: string;
  endDate?: string;
  images?: string[];
}

export interface PanchayatDetails {
  id: string;
  name: string;
  district: string;
  state: string;
  block: string;
  population?: number;
  area: string;
  aboutText: string;
  wards?: number;
  subdomain: string;
  established: number;
  description?: string;
  heroImage?: string;
  contactInfo?: {
    address: string;
    phone: string;
    email: string;
    officeHours: string;
    mapCoordinates?: string;
  };
  features?: string[];
  mapCoordinates?: string;
  themeId?: string; // Selected theme ID
}

export interface RegistrationFormData {
  // Personal Details
  sachivName: string;
  email: string;
  phone: string;
  designation: string;
  password: string;
  confirmPassword: string;
  // Panchayat Details
  panchayatName: string;
  district: string;
  state: string;
  block: string;
  population: string;
  area: string;
  wards: string;
  subdomain: string;
  // Documents
  idProof: File | null;
  appointmentLetter: File | null;
  panchayatCertificate: File | null;
  // Terms
  acceptTerms: boolean;
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface ActivePanchayat {
  id?: string;
  name: string;
  district: string;
  state?: string;
  schemes: number;
  population?: number;
  subdomain: string;
  status?: string;
  established?: number;
  area?: string;
  wards?: number;
}

// Admin & Team Management Types
export type UserRole = "super_admin" | "panchayat_admin" | "user";
export type UserStatus = "active" | "inactive" | "suspended";
export type PanchayatStatus = "active" | "inactive" | "suspended";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  panchayatId?: string;
  panchayatName?: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
}

export interface TeamMember {
  id: string;
  panchayatId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  image?: string;
  imageKey?: string;
  hasImage?: boolean;
  initials?: string;
  role: string;
  status: UserStatus;
  createdAt: string;
  lastActive?: string;
}

// Document Types
export interface Document {
  documentId?: number;
  id?: string;
  panchayatId: string;
  title: string;
  description?: string;
  category: string;
  fileUrl?: string; // Legacy field
  fileName: string;
  fileSize: number;
  fileType?: string;
  mimeType?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedByUserId?: number;
  uploadedAt: string;
  createdAt?: string;
  isPublic?: boolean;
  visibility?: "PUBLIC" | "PRIVATE";
  googleDriveFileId?: string;
  viewLink?: string; // Google Drive preview URL
  isAvailable?: boolean;
  downloadCount?: number;
  showOnWebsite?: boolean; // Whether to display on public website
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  panchayatId: string;
  author: string;
  authorEmail?: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Gallery Album Types
export interface Album {
  id: string;
  panchayatId: string;
  title: string;
  description?: string;
  coverImage?: string;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Settings Types
export interface PanchayatSettings {
  id: string;
  panchayatId: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    image?: string;
    displayType?: 'image' | 'theme';
  };
  about: {
    title: string;
    content: string;
    features: string[];
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    officeHours: string;
    mapCoordinates?: string;
  };
  basicInfo: {
    population?: number;
    area?: string;
    wards?: number;
    establishedYear?: number;
    mapCoordinates?: string;
  };
  logo?: string;
  themeId?: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsOverview {
  totalVisitors: number;
  activeSchemes: number;
  announcements: number;
  photoGallery: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
}

export interface PageView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface PopularPost {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
}

export interface EngagementStats {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagement: number;
  topEngagedPosts: PopularPost[];
}

// Super Admin Types
export interface SuperAdminPanchayat {
  id: string;
  panchayatName: string;
  slug: string;
  district: string;
  state: string;
  status: PanchayatStatus;
  adminCount: number;
  createdAt: string;
  lastActive?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// Post Status
export type PostStatus = "draft" | "published";

export interface PostWithStatus extends Post {
  status?: PostStatus;
}

// Section Management Types - Professional Generic Section Types
export type LayoutType =
  | "GRID"
  | "ROW"
  | "SCROLLING_ROW"
  | "CAROUSEL"
  | "MASONRY"
  | "LIST"
  | "SPLIT"
  | "FULL_WIDTH"
  | "CONTAINED";

// Generic professional section types that work for both platforms
export type SectionType =
  // Content Sections
  | "PARAGRAPH_CONTENT" // Rich text/paragraph content section
  | "IMAGE_WITH_TEXT" // Image with accompanying text section
  | "IMAGE_GALLERY" // Image gallery section (grid/masonry/carousel)
  | "VIDEO_SECTION" // Video embed section
  | "CARD_SECTION" // Card-based content section
  | "CARD_GRID" // Enhanced card grid with styling options
  | "STATISTICS_SECTION" // Statistics/metrics display section
  | "TESTIMONIALS_SECTION" // Testimonials/reviews section
  | "FAQ_SECTION" // FAQ/accordion section
  | "FORM_SECTION" // Form section
  | "TIMELINE_SECTION" // Timeline/chronological section
  | "MAP_SECTION" // Map/location section
  | "HERO_BANNER" // Hero banner section with CTA
  | "SPLIT_CONTENT" // Split content (image left/right with text)
  | "FEATURES_GRID" // Features grid section
  | "NEWS_FEED" // News/announcements feed section
  | "CONTACT_INFO" // Contact information section
  | "TEAM_MEMBERS" // Team/members grid section
  | "SCHEMES_LIST" // Schemes/programs list section
  | "CALL_TO_ACTION" // Call-to-action section
  | "ACTIVE_PANCHAYATS_GRID"; // Active panchayats grid (platform only)

// For backward compatibility, map old types to new types
export type PlatformSectionType = SectionType;
export type PanchayatSectionType = SectionType;

// Enhanced content structures
export interface ContentItem {
  id?: string;
  type?:
    | "image"
    | "card"
    | "testimonial"
    | "accordion_item"
    | "timeline_item"
    | "stat"
    | "feature"
    | "gallery_item";
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageKey?: string;
  imageFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  link?: string;
  icon?: string;
  value?: string;
  label?: string;
  order?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface BackgroundConfig {
  type: "color" | "gradient" | "image" | "video";
  value: string; // Color hex, gradient CSS, image URL, video URL
  overlay?: string; // Overlay color with opacity
  parallax?: boolean;
  imageKey?: string;
}

export interface SpacingConfig {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  padding?: number;
  margin?: number;
}

export interface AnimationConfig {
  type?: "fade-in" | "slide-in" | "zoom" | "none";
  delay?: number;
  duration?: number;
}

export interface CTAConfig {
  text: string;
  link: string;
  style?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: string;
}

export interface MediaConfig {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select, radio
  validation?: Record<string, any>;
}

export type CarouselLayoutType = 
  | 'single'           // One item visible at a time
  | 'multi'            // Multiple items visible (configurable)
  | 'centered'          // Active item centered with partial prev/next visible
  | 'full-width'       // Slide occupies entire viewport width
  | 'thumbnail';        // Main carousel synced with thumbnail navigation

export type CarouselIndicatorType = 
  | 'dots'             // Dot indicators (default)
  | 'progress'          // Progress bar indicator
  | 'numbered'          // Numbered indicators (e.g., 1 / 5)
  | 'arrows-only';      // Arrow-only mode (no indicators)

export interface CarouselConfig {
  layoutType?: CarouselLayoutType;
  indicatorType?: CarouselIndicatorType;
  itemsPerView?: number;        // For multi layout: number of items visible
  itemsPerViewMobile?: number;  // Mobile override
  itemsPerViewTablet?: number;  // Tablet override
  autoPlay?: boolean;
  interval?: number;            // Auto-play interval in ms
  pauseOnHover?: boolean;
  loop?: boolean;                // Infinite loop
  showArrows?: boolean;
  showIndicators?: boolean;
  transitionDuration?: number;   // Transition duration in ms
  gap?: number;                  // Gap between items in pixels
  centeredSlides?: boolean;      // Center slides (for centered layout)
  partialVisible?: boolean;      // Show partial prev/next slides
}

export interface SectionContent {
  items?: ContentItem[];
  background?: BackgroundConfig;
  spacing?: SpacingConfig;
  animation?: AnimationConfig;
  cta?: CTAConfig;
  richText?: string; // HTML content for text sections
  media?: MediaConfig;
  formFields?: FormField[];
  columns?: number;
  autoPlay?: boolean;
  interval?: number;
  limit?: number;
  carouselConfig?: CarouselConfig; // Carousel-specific configuration
  customSettings?: Record<string, any>;
  [key: string]: any;
}

export interface PlatformSection {
  id: string;
  sectionType: PlatformSectionType;
  title?: string;
  subtitle?: string;
  content: any; // JSON
  layoutType: LayoutType;
  displayOrder: number;
  isVisible: boolean;
  backgroundColor?: string;
  textColor?: string;
  imageUrl?: string;
  imageKey?: string;
  imageFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PanchayatWebsiteSection {
  id: string;
  panchayatId: string;
  sectionType: PanchayatSectionType;
  title?: string;
  subtitle?: string;
  content: any; // JSON
  layoutType: LayoutType;
  displayOrder: number;
  isVisible: boolean;
  backgroundColor?: string;
  textColor?: string;
  imageUrl?: string;
  imageKey?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformLandingPageConfig {
  sections: PlatformSection[];
}

export interface PanchayatWebsiteConfig {
  sections: PanchayatWebsiteSection[];
}
