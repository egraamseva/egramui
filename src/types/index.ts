/**
 * Shared TypeScript types and interfaces for the e-GramSeva application
 */

export type PageType = "landing" | "registration" | "panchayat-demo" | "dashboard" | "success";

export type Language = "en" | "hi" | "regional";

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
  population: number;
  area: string;
  wards: number;
  subdomain: string;
  established: number;
  description?: string;
  heroImage?: string;
  contactInfo?: {
    address: string;
    phone: string;
    email: string;
    officeHours: string;
  };
  features?: string[];
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
  name: string;
  district: string;
  schemes: number;
  population: number;
  subdomain: string;
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
  role: string;
  status: UserStatus;
  createdAt: string;
  lastActive?: string;
}

// Document Types
export interface Document {
  id: string;
  panchayatId: string;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  isPublic: boolean;
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
  };
  logo?: string;
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

