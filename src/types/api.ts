/**
 * API Response Types
 * Types matching the backend API structure from egram-backend
 */

// Base API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// User & Auth Types
export type UserRole = 'SUPER_ADMIN' | 'PANCHAYAT_ADMIN' | 'PANCHAYAT_MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  panchayatId?: number;
  panchayatName?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  panchayatSlug: string;
  password: string;
  phone: string;
  designation?: string;
  panchayatName?: string;
  district?: string;
  state?: string;
}

// Panchayat Types
export type PanchayatStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Panchayat {
  panchayatId: number;
  panchayatName: string;
  slug: string;
  district: string;
  state: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string;
  heroImageUrl?: string;
  description?: string;
  aboutText?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  mapCoordinates?: string;
  officeHours?: string;
  status: PanchayatStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePanchayatRequest {
  district: string;
  panchayatName: string;
  slug: string;
  state: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  aboutText?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  mapCoordinates?: string;
  officeHours?: string;
}

// Post Types
export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface Post {
  postId: number;
  title: string;
  bodyText: string;
  mediaUrl?: string;
  status: PostStatus;
  publishedAt?: string;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  panchayatId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  bodyText: string;
  title: string;
  mediaUrl?: string;
}

export interface UpdatePostRequest {
  bodyText?: string;
  title?: string;
  mediaUrl?: string;
}

// Comment Types
export interface Comment {
  commentId: number;
  commenterName: string;
  commenterEmail: string;
  bodyText: string;
  approvedFlag: boolean;
  postId: number;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  bodyText: string;
  commenterName: string;
  commenterEmail: string;
  parentCommentId?: number;
}

// Team Member Types
export interface TeamMember {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  panchayatId: number;
  panchayatName: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddTeamMemberRequest {
  email: string;
  name: string;
  password: string;
  phone: string;
}

// Panchayat Stats
export interface PanchayatStats {
  totalUsers: number;
  totalPosts: number;
  totalAnnouncements: number;
  totalSchemes: number;
  totalDocuments: number;
  totalGalleryImages: number;
}

// Profile Update
export interface UpdateProfileRequest {
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  token: string;
}

