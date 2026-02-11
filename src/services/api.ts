/**
 * API Service Layer
 * Handles all API calls to the egram backend
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Panchayat,
  CreatePanchayatRequest,
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  Comment,
  CreateCommentRequest,
  TeamMember,
  AddTeamMemberRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  PanchayatStats,
} from "../types/api";
import type {
  SuperAdminPanchayat,
  AdminUser,
  AuditLog,
  PanchayatStatus,
} from "../types";
import {
  galleryApi,
  albumApi,
  settingsApi,
  adminPanchayatApi,
  adminUserApi,
  adminAnalyticsApi,
  adminAuditLogApi,
} from "@/routes/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://egrambackend-production.up.railway.app/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling with refresh token support
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Try to refresh token (if refresh token endpoint exists)
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post<
            ApiResponse<{ token: string; refreshToken?: string }>
          >(
            `${
              import.meta.env.VITE_API_BASE_URL ||
              "https://egrambackend-production.up.railway.app/api/v1"
            }/api/v1/auth/refresh`,
            { refreshToken }
          );
          const { token } = response.data.data || response.data;
          if (token) {
            localStorage.setItem("authToken", token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            processQueue(null, token);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          // Refresh failed, logout user
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }

      // No refresh token or refresh failed
      isRefreshing = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Authentication API
// ============================================================================
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<any, ApiResponse<User>>("/auth/me");
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post("/auth/forgot-password", data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post("/auth/reset-password", data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put("/auth/change-password", data);
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<any, ApiResponse<User>>(
      "/auth/update-profile",
      data
    );
    return response.data;
  },
};

// ============================================================================
// Public API
// ============================================================================
export const publicAPI = {
  getAllPanchayats: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Panchayat>> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<Panchayat>>
    >("/public/panchayats", { params });
    return response.data;
  },

  getAllPanchayatsSimple: async (): Promise<Panchayat[]> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<Panchayat>>
    >("/public/panchayats", {
      params: { pageNumber: 0, pageSize: 9999 },
    });
    return response.data.content;
  },

  getPanchayatBySlug: async (slug: string): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(
      `/public/panchayats/slug/${slug}`
    );
    return response.data;
  },

  getPanchayatByDomain: async (domain: string): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(
      "/public/panchayats/by-domain",
      { params: { domain } }
    );
    const body = response.data as ApiResponse<Panchayat> & { data?: Panchayat };
    return body?.data ?? response.data;
  },

  getHomePageData: async (slug: string): Promise<any> => {
    const response = await api.get<any, ApiResponse<any>>(
      `/public/${slug}/home`
    );
    return response.data;
  },

  getPublicPosts: async (
    slug: string,
    params?: { page?: number; size?: number; sort?: string }
  ): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>(
      `/public/${slug}/posts`,
      { params }
    );
    return response.data;
  },

  getPublicPostById: async (slug: string, postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(
      `/public/${slug}/posts/${postId}`
    );
    return response.data;
  },

  getPublicPostComments: async (
    slug: string,
    postId: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<Comment>>
    >(`/public/${slug}/posts/${postId}/comments`, { params });
    return response.data;
  },

  addPublicComment: async (
    slug: string,
    postId: number,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await api.post<any, ApiResponse<Comment>>(
      `/public/${slug}/posts/${postId}/comments`,
      data
    );
    return response.data;
  },

  getPublicSchemes: async (
    slug: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Scheme>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/schemes`,
      { params }
    );
    return response.data;
  },

  getPublicAnnouncements: async (
    slug: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Announcement>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/announcements`,
      { params }
    );
    return response.data;
  },

  getPublicGallery: async (
    slug: string,
    params?: { page?: number; size?: number; albumId?: number }
  ): Promise<PaginatedResponse<GalleryItem>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/gallery`,
      { params }
    );
    return response.data;
  },

  getPublicAlbum: async (
    slug: string,
    params?: { page?: number; size?: number; albumId?: number }
  ): Promise<PaginatedResponse<Album>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/albums`,
      { params }
    );
    return response.data;
  },

  getPublicMembers: async (
    slug: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<PanchayatMember>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/members`,
      { params }
    );
    return response.data;
  },
};

// ============================================================================
// Panchayat Posts API (Authenticated)
// ============================================================================
export const postsAPI = {
  getAllPosts: async (params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>(
      "/panchayat/posts",
      { params }
    );
    return response.data;
  },

  // Compatibility alias for getAllPosts
  getAll: async (_panchayatId?: string): Promise<UIPost[]> => {
    const result = await postsAPI.getAllPosts();
    return result.content.map(convertPostToUI);
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(
      `/panchayat/posts/${postId}`
    );
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<any, ApiResponse<Post>>(
      "/panchayat/posts",
      data
    );
    return response.data;
  },

  // Compatibility alias for createPost
  create: async (data: CreatePostRequest): Promise<UIPost> => {
    const result = await postsAPI.createPost(data);
    return convertPostToUI(result);
  },

  updatePost: async (
    postId: number,
    data: UpdatePostRequest
  ): Promise<Post> => {
    const response = await api.put<any, ApiResponse<Post>>(
      `/panchayat/posts/${postId}`,
      data
    );
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/panchayat/posts/${postId}`);
  },

  // Compatibility alias for deletePost
  delete: async (postId: number | string): Promise<void> => {
    const id = typeof postId === "string" ? parseInt(postId) : postId;
    await postsAPI.deletePost(id);
  },

  publishPost: async (postId: number): Promise<Post> => {
    const response = await api.patch<any, ApiResponse<Post>>(
      `/panchayat/posts/${postId}/publish`
    );
    return response.data;
  },
};

// ============================================================================
// Post Comments API (Authenticated)
// ============================================================================
export const commentsAPI = {
  getPostComments: async (
    postId: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<Comment>>
    >(`/panchayat/posts/${postId}/comments`, { params });
    return response.data;
  },

  // Compatibility alias for getPostComments
  getByPost: async (postId: number | string): Promise<UIComment[]> => {
    const id = typeof postId === "string" ? parseInt(postId) : postId;
    const result = await commentsAPI.getPostComments(id);
    return result.content.map(convertCommentToUI);
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/panchayat/posts/${postId}/comments/${commentId}`);
  },

  // Compatibility alias for deleteComment
  delete: async (postId: number | string, commentId: number): Promise<void> => {
    const id = typeof postId === "string" ? parseInt(postId) : postId;
    await commentsAPI.deleteComment(id, commentId);
  },

  approveComment: async (
    postId: number,
    commentId: number
  ): Promise<Comment> => {
    const response = await api.patch<any, ApiResponse<Comment>>(
      `/panchayat/posts/${postId}/comments/${commentId}/approve`
    );
    return response.data;
  },

  // Compatibility alias for approveComment
  approve: async (
    postId: number | string,
    commentId: number
  ): Promise<UIComment> => {
    const id = typeof postId === "string" ? parseInt(postId) : postId;
    const result = await commentsAPI.approveComment(id, commentId);
    return convertCommentToUI(result);
  },
};

// ============================================================================
// Team Management API
// ============================================================================
export const teamAPI = {
  getTeamMembers: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<TeamMember>> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<TeamMember>>
    >("/panchayat/team", { params });
    return response.data;
  },

  // Compatibility alias for getTeamMembers
  getAllMembers: async (_panchayatId?: string): Promise<UITeamMember[]> => {
    const result = await teamAPI.getTeamMembers();
    return result.content.map(convertTeamMemberToUI);
  },

  addTeamMember: async (data: AddTeamMemberRequest): Promise<TeamMember> => {
    const response = await api.post<any, ApiResponse<TeamMember>>(
      "/panchayat/team",
      data
    );
    return response.data;
  },

  // Compatibility alias for addTeamMember
  addMember: async (
    _panchayatId: string,
    data: AddTeamMemberRequest
  ): Promise<TeamMember> => {
    return await teamAPI.addTeamMember(data);
  },

  removeTeamMember: async (userId: number): Promise<void> => {
    await api.delete(`/panchayat/team/${userId}`);
  },

  // Compatibility alias for removeTeamMember
  removeMember: async (userId: number | string): Promise<void> => {
    const id = typeof userId === "string" ? parseInt(userId) : userId;
    await teamAPI.removeTeamMember(id);
  },

  updateTeamMemberStatus: async (
    userId: number,
    status: string
  ): Promise<TeamMember> => {
    const response = await api.patch<any, ApiResponse<TeamMember>>(
      `/panchayat/team/${userId}/status`,
      { status }
    );
    return response.data;
  },

  // Compatibility alias for updateTeamMemberStatus
  updateMemberStatus: async (
    userId: number | string,
    status: string
  ): Promise<UITeamMember> => {
    const id = typeof userId === "string" ? parseInt(userId) : userId;
    const result = await teamAPI.updateTeamMemberStatus(id, status);
    return convertTeamMemberToUI(result);
  },
};

// ============================================================================
// Admin Panchayats API
// ============================================================================
export const adminPanchayatsAPI = {
  getAllPanchayats: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    district?: string;
    state?: string;
  }): Promise<PaginatedResponse<Panchayat>> => {
    const response = await api.get<
      any,
      ApiResponse<PaginatedResponse<Panchayat>>
    >("/admin/panchayats", { params });
    return response.data;
  },

  getPanchayatById: async (panchayatId: number): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(
      `/admin/panchayats/${panchayatId}`
    );
    return response.data;
  },

  createPanchayat: async (data: CreatePanchayatRequest): Promise<Panchayat> => {
    const response = await api.post<any, ApiResponse<Panchayat>>(
      "/admin/panchayats",
      data
    );
    return response.data;
  },

  updatePanchayat: async (
    panchayatId: number,
    data: Partial<CreatePanchayatRequest>
  ): Promise<Panchayat> => {
    const response = await api.put<any, ApiResponse<Panchayat>>(
      `/admin/panchayats/${panchayatId}`,
      data
    );
    return response.data;
  },

  deletePanchayat: async (panchayatId: number): Promise<void> => {
    await api.delete(`/admin/panchayats/${panchayatId}`);
  },

  updatePanchayatStatus: async (
    panchayatId: number,
    status: string
  ): Promise<Panchayat> => {
    const response = await api.patch<any, ApiResponse<Panchayat>>(
      `/admin/panchayats/${panchayatId}/status`,
      { status }
    );
    return response.data;
  },

  getPanchayatStats: async (panchayatId: number): Promise<PanchayatStats> => {
    const response = await api.get<any, ApiResponse<PanchayatStats>>(
      `/admin/panchayats/${panchayatId}/stats`
    );
    return response.data;
  },
};

// ============================================================================
// Backward Compatibility Wrappers
// These maintain compatibility with existing code that uses the old API structure
// ============================================================================

// Import old types for compatibility
import type {
  Scheme,
  PanchayatMember,
  Announcement,
  GalleryItem,
  ActivePanchayat,
  Project,
  PanchayatDetails,
  Document,
  Album,
  PanchayatSettings,
  AnalyticsOverview,
  Post as UIPost,
  Comment as UIComment,
  TeamMember as UITeamMember,
  UserStatus,
} from "../types";

// Type conversion helpers
const convertPostToUI = (apiPost: Post): UIPost => ({
  id: apiPost.postId.toString(),
  panchayatId: apiPost.panchayatId.toString(),
  author: apiPost.authorName,
  authorRole: "Sachiv",
  timestamp: apiPost.createdAt,
  content: apiPost.bodyText,
  media: apiPost.mediaUrl ? [{ type: "image", url: apiPost.mediaUrl }] : [],
  likes: apiPost.likesCount,
  comments: apiPost.commentsCount,
  shares: 0,
});

const convertCommentToUI = (apiComment: Comment): UIComment => ({
  id: apiComment.commentId.toString(),
  postId: apiComment.postId.toString(),
  panchayatId: "",
  author: apiComment.commenterName,
  authorEmail: apiComment.commenterEmail,
  content: apiComment.bodyText,
  status: apiComment.approvedFlag ? "approved" : "pending",
  createdAt: apiComment.createdAt,
});

const convertTeamMemberToUI = (apiMember: TeamMember): UITeamMember => ({
  id: apiMember.userId.toString(),
  panchayatId: apiMember.panchayatId.toString(),
  name: apiMember.name,
  email: apiMember.email,
  role: apiMember.role,
  status: apiMember.status.toLowerCase() as "active" | "inactive" | "suspended",
  createdAt: apiMember.createdAt,
  lastActive: apiMember.lastLogin,
});

// Panchayat API - compatibility wrapper
export const panchayatAPI = {
  getAll: async (): Promise<ActivePanchayat[]> => {
    const panchayats = await publicAPI.getAllPanchayatsSimple();
    return panchayats.map((p) => ({
      id: p.panchayatId.toString(),
      name: p.panchayatName,
      district: p.district,
      state: p.state,
      subdomain: p.slug,
      population: p.population || undefined,
      area: p.area || "",
      wards: p.wards || undefined,
      established: p.establishedYear || new Date(p.createdAt).getFullYear(),
      status: p.status as any,
      schemes: 0,
    }));
  },

  getBySlug: async (slug: string): Promise<PanchayatDetails> => {
    const panchayat = await publicAPI.getPanchayatBySlug(slug);

    // Use office fields for contact info, fallback to contact fields
    const contactAddress = panchayat.officeAddress || panchayat.address || "";
    const contactPhone = panchayat.officePhone || panchayat.contactPhone || "";
    const contactEmail = panchayat.officeEmail || panchayat.contactEmail || "";
    const officeHours = panchayat.officeHours || "";

    // Use description or aboutText for description
    const description = panchayat.description || panchayat.aboutText || "";

    // Extract year from createdAt for established year
    const established = panchayat.createdAt
      ? new Date(panchayat.createdAt).getFullYear()
      : new Date().getFullYear();

    return {
      id: panchayat.panchayatId.toString(),
      name: panchayat.panchayatName || "",
      district: panchayat.district || "",
      state: panchayat.state || "",
      aboutText: panchayat.aboutText || "",
      block: "", // Not available in backend
      population: panchayat.population || undefined, // Not available in backend
      area: panchayat.area || "", // Not available in backend
      wards: panchayat.wards || undefined, // Not available in backend
      subdomain: panchayat.slug || "",
      established: panchayat.establishedYear || established,
      description: description,
      heroImage: panchayat.heroImageUrl || undefined,
      mapCoordinates: panchayat.mapCoordinates || "",
      themeId: panchayat.themeId || undefined,
      contactInfo: {
        address: contactAddress,
        phone: contactPhone,
        email: contactEmail,
        officeHours: officeHours,
      },
      features: [], // Not available in backend yet
    };
  },

  getBySubdomain: async (subdomain: string): Promise<PanchayatDetails> => {
    return await panchayatAPI.getBySlug(subdomain);
  },

  // Register new panchayat with admin user
  register: async (formData: any): Promise<AuthResponse> => {
    // Map frontend form data to backend RegisterRequest format
    const registerData: RegisterRequest = {
      email: formData.email,
      name: formData.sachivName,
      panchayatSlug: formData.subdomain.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone?.replace(/\D/g, "").substring(0, 10) || "", // Clean phone number
      designation: formData.designation || undefined,
      panchayatName: formData.panchayatName || undefined,
      district: formData.district || undefined,
      state: formData.state || undefined,
    };

    return await authAPI.register(registerData);
  },
};

// Schemes API - placeholder (not in backend yet)
export const schemesAPI = {
  getAll: async (_panchayatId?: string): Promise<Scheme[]> => {
    return [];
  },
  create: async (
    _panchayatId: string,
    _data: Omit<Scheme, "id">
  ): Promise<Scheme> => {
    throw new Error("Not implemented in backend yet");
  },
  update: async (_id: string, _updates: Partial<Scheme>): Promise<Scheme> => {
    throw new Error("Not implemented in backend yet");
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error("Not implemented in backend yet");
  },
};

// Announcements API - uses publicAPI for public access, announcementApi for authenticated
export const announcementsAPI = {
  getAll: async (): Promise<Announcement[]> => {
    // For public access, we need slug, not ID
    // This is a compatibility method - should use publicAPI.getPublicAnnouncements with slug
    return [];
  },
  create: async (
    _panchayatId: string,
    _data: Omit<Announcement, "id">
  ): Promise<Announcement> => {
    throw new Error("Use announcementApi.create instead");
  },
  update: async (
    _id: string,
    _updates: Partial<Announcement>
  ): Promise<Announcement> => {
    throw new Error("Use announcementApi.update instead");
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error("Use announcementApi.delete instead");
  },
};

// Members API - uses publicAPI for public access
export const membersAPI = {
  getAll: async (_panchayatId?: string): Promise<PanchayatMember[]> => {
    // For public access, we need slug, not ID
    // This is a compatibility method - should use publicAPI.getPublicMembers with slug
    return [];
  },
  create: async (
    _panchayatId: string,
    _data: Omit<PanchayatMember, "id">
  ): Promise<PanchayatMember> => {
    throw new Error("Members are managed through team API");
  },
  update: async (
    _id: string,
    _updates: Partial<PanchayatMember>
  ): Promise<PanchayatMember> => {
    throw new Error("Members are managed through team API");
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error("Members are managed through team API");
  },
};

// Gallery API - uses publicAPI for public access, galleryApi for authenticated
export const galleryAPI = {
  getAll: async (): Promise<GalleryItem[]> => {
    // For public access, we need slug, not ID
    // This is a compatibility method - should use publicAPI.getPublicGallery with slug
    return [];
  },
  create: async (data: Omit<GalleryItem, "id">): Promise<GalleryItem> => {
    return await galleryApi.create({
      imageUrl: data.image,
      caption: data.title !== "Gallery Image" ? data.title : undefined,
      tags: data.category,
    });
  },
  update: async (
    id: string,
    updates: Partial<GalleryItem>
  ): Promise<GalleryItem> => {
    return await galleryApi.update(id, {
      imageUrl: updates.image,
      caption: updates.title !== "Gallery Image" ? updates.title : undefined,
      tags: updates.category,
    });
  },
  delete: async (id: string): Promise<void> => {
    await galleryApi.delete(id);
  },
};

// Projects API - placeholder (not in backend yet)
export const projectsAPI = {
  getAll: async (_panchayatId?: string): Promise<Project[]> => {
    return [];
  },
  create: async (
    _panchayatId: string,
    _data: Omit<Project, "id">
  ): Promise<Project> => {
    throw new Error("Not implemented in backend yet");
  },
  update: async (_id: string, _updates: Partial<Project>): Promise<Project> => {
    throw new Error("Not implemented in backend yet");
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error("Not implemented in backend yet");
  },
};

// Analytics API - placeholder (not in backend yet)
export const analyticsAPI = {
  getStats: async (_panchayatId: string): Promise<AnalyticsOverview> => {
    return {
      totalVisitors: 0,
      activeSchemes: 0,
      announcements: 0,
      photoGallery: 0,
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
    };
  },
  getOverview: async (panchayatId: string): Promise<AnalyticsOverview> => {
    return await analyticsAPI.getStats(panchayatId);
  },
  getPageViews: async (_panchayatId: string): Promise<any[]> => {
    return [];
  },
  getPopularPosts: async (_panchayatId: string): Promise<any[]> => {
    return [];
  },
  getEngagement: async (_panchayatId: string): Promise<any> => {
    return {
      likes: 0,
      comments: 0,
      shares: 0,
    };
  },
};

// Consent API
export const consentAPI = {
  grant: async (): Promise<void> => {
    const response = await api.post<ApiResponse<any>>("/consent/grant");
    return response.data.data;
  },
  getStatus: async (): Promise<{ hasConsent: boolean; consentTimestamp?: string }> => {
    // Response interceptor extracts response.data, so response is already the ApiResponse
    const response = await api.get<ApiResponse<{ hasConsent: boolean; consentTimestamp?: string }>>("/consent/status");
    // response is ApiResponse<{ hasConsent: boolean; ... }>, so response.data is { hasConsent: boolean; ... }
    const data = response.data as { hasConsent?: boolean; consentTimestamp?: string };
    return { 
      hasConsent: data?.hasConsent === true,
      consentTimestamp: data?.consentTimestamp
    };
  },
  revoke: async (reason?: string): Promise<void> => {
    await api.post<ApiResponse<any>>("/consent/revoke", null, {
      params: reason ? { reason } : undefined,
    });
  },
};

// Google OAuth API
export const googleOAuthAPI = {
  getAuthorizationUrl: async (): Promise<string> => {
    // Response interceptor extracts response.data, so response is already the ApiResponse
    const response = await api.get<ApiResponse<{ authorizationUrl: string }>>("/auth/google/authorize");
    // response is ApiResponse<{ authorizationUrl: string }>, so response.data is { authorizationUrl: string }
    const data = response.data as { authorizationUrl?: string };
    const authUrl = data?.authorizationUrl;
    if (!authUrl) {
      console.error("Full API response:", response);
      throw new Error("Authorization URL not received from server. Response: " + JSON.stringify(response));
    }
    return authUrl;
  },
  getConnectionStatus: async (): Promise<{ isConnected: boolean }> => {
    // Response interceptor extracts response.data, so response is already the ApiResponse
    const response = await api.get<ApiResponse<{ isConnected: boolean }>>("/auth/google/status");
    // response is ApiResponse<{ isConnected: boolean }>, so response.data is { isConnected: boolean }
    const data = response.data as { isConnected?: boolean };
    return { isConnected: data?.isConnected === true };
  },
  revokeAccess: async (): Promise<void> => {
    await api.post<ApiResponse<any>>("/auth/google/revoke");
  },
};

// Documents API with Google Drive integration
export const documentsAPI = {
  upload: async (
    panchayatId: string,
    file: File,
    data: {
      title: string;
      description?: string;
      category: string;
      visibility?: "PUBLIC" | "PRIVATE";
    }
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("visibility", data.visibility || "PRIVATE");

    const response = await api.post<ApiResponse<any>>(
      "/panchayat/documents",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },
  getAll: async (
    panchayatId: string,
    category?: string,
    visibility?: "PUBLIC" | "PRIVATE"
  ): Promise<any[]> => {
    const params: any = {};
    if (category) params.category = category;
    if (visibility) params.visibility = visibility;

    // Response interceptor extracts response.data, so response is already the ApiResponse
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>(
      "/panchayat/documents",
      { params }
    );
    // After interceptor, response is ApiResponse<PaginatedResponse<any>>
    // So response.data is PaginatedResponse<any>, and response.data.content is the array
    const documents = (response.data as any)?.content || [];
    
    // Map documentId to id for compatibility with Document interface
    return documents.map((doc: any) => ({
      ...doc,
      id: doc.id || String(doc.documentId),
      uploadedAt: doc.uploadedAt || doc.createdAt,
      panchayatId: panchayatId, // Ensure panchayatId is set
    }));
  },
  getById: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/panchayat/documents/${id}`);
    return response.data.data;
  },
  getViewLink: async (id: string): Promise<string> => {
    const response = await api.get<ApiResponse<any>>(`/panchayat/documents/${id}/view`);
    return response.data.data?.viewLink || "";
  },
  updateVisibility: async (
    id: string,
    visibility: "PUBLIC" | "PRIVATE"
  ): Promise<any> => {
    const response = await api.patch<ApiResponse<any>>(
      `/panchayat/documents/${id}/visibility`,
      null,
      { params: { visibility } }
    );
    return response.data.data;
  },
  update: async (
    id: string,
    data: {
      title: string;
      description?: string;
      category: string;
      visibility?: "PUBLIC" | "PRIVATE";
    }
  ): Promise<any> => {
    const params: any = {
      title: data.title,
      category: data.category,
    };
    if (data.description) params.description = data.description;
    if (data.visibility) params.visibility = data.visibility;

    const response = await api.put<ApiResponse<any>>(
      `/panchayat/documents/${id}`,
      null,
      { params }
    );
    return response.data.data;
  },
  toggleShowOnWebsite: async (id: string): Promise<any> => {
    const response = await api.patch<ApiResponse<any>>(
      `/panchayat/documents/${id}/show-on-website`,
      null
    );
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<any>>(`/panchayat/documents/${id}`);
  },
  // Public endpoints
  getPublicDocuments: async (
    slug: string,
    category?: string
  ): Promise<any[]> => {
    const params: any = {};
    if (category) params.category = category;

    // Response interceptor extracts response.data, so response is already the ApiResponse
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/documents`,
      { params }
    );
    // After interceptor, response is ApiResponse<PaginatedResponse<any>>
    // So response.data is PaginatedResponse<any>, and response.data.content is the array
    const paginatedData = (response as any).data as PaginatedResponse<any>;
    const documents = paginatedData?.content || [];
    
    // Map documentId to id for compatibility with Document interface
    return documents.map((doc: any) => ({
      ...doc,
      id: doc.id || String(doc.documentId),
      uploadedAt: doc.uploadedAt || doc.createdAt,
    }));
  },
  getPublicDocumentView: async (slug: string, id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(
      `/public/${slug}/documents/${id}/view`
    );
    return response.data.data;
  },
  // Website documents (shown on public website)
  getWebsiteDocuments: async (
    slug: string,
    category?: string
  ): Promise<any[]> => {
    const params: any = {};
    if (category) params.category = category;

    const response = await api.get<ApiResponse<PaginatedResponse<any>>>(
      `/public/${slug}/website-documents`,
      { params }
    );
    return response.data.data?.content || [];
  },
};

// Albums API - uses routes/api.ts albumApi
export const albumsAPI = {
  create: async (data: any): Promise<Album> => {
    return await albumApi.create(data);
  },
  getAll: async (): Promise<Album[]> => {
    const result = await albumApi.list();
    return result.items;
  },
  update: async (id: string, updates: any): Promise<Album> => {
    // Note: panchayatId is not needed as it uses TenantContext
    return await albumApi.update(id, updates);
  },
  delete: async (id: string): Promise<void> => {
    await albumApi.delete(id);
  },
};

// Settings API - uses routes/api.ts settingsApi
export const settingsAPI = {
  get: async (): Promise<PanchayatSettings> => {
    const data = await settingsApi.get();

    // Parse aboutFeatures JSON string to array
    let features: string[] = [];
    if (data.aboutFeatures) {
      try {
        features = JSON.parse(data.aboutFeatures);
        if (!Array.isArray(features)) {
          features = [];
        }
      } catch (e) {
        features = [];
      }
    }

    // Map backend response to frontend PanchayatSettings
    return {
      id: String(data.panchayatId),
      panchayatId: String(data.panchayatId),
      hero: {
        title: data.heroTitle || data.panchayatName || "",
        subtitle: data.heroSubtitle || data.district || "",
        description: data.description || "",
        image: data.heroImageUrl || undefined,
      },
      about: {
        title: data.aboutTitle || "About Us",
        content: data.aboutText || "",
        features: features,
      },
      contact: {
        address: data.officeAddress || data.address || "",
        phone: data.officePhone || data.contactPhone || "",
        email: data.officeEmail || data.contactEmail || "",
        officeHours: data.officeHours || "",
      },
      basicInfo: {
        population: data.population || undefined,
        area: data.area || "",
        wards: data.wards || undefined,
        establishedYear: data.establishedYear || undefined,
        mapCoordinates: data.mapCoordinates || "",
      },
      logo: data.logoUrl,
      themeId: data.themeId,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
  update: async (
    updates: Partial<PanchayatSettings>
  ): Promise<PanchayatSettings> => {
    const payload: any = {};

    // Handle themeId update
    if (updates.themeId !== undefined) {
      payload.themeId = updates.themeId || null;
    }

    if (updates.hero) {
      if (updates.hero.title !== undefined)
        payload.heroTitle = updates.hero.title || null;
      if (updates.hero.subtitle !== undefined)
        payload.heroSubtitle = updates.hero.subtitle || null;
      if (updates.hero.description !== undefined)
        payload.description = updates.hero.description || null;
      if (updates.hero.image !== undefined)
        payload.heroImageUrl = updates.hero.image || null;
      if(updates.hero.image === undefined)
        payload.heroImageUrl = null;
    }
    if (updates.about) {
      if (updates.about.title !== undefined)
        payload.aboutTitle = updates.about.title || null;
      if (updates.about.content !== undefined)
        payload.aboutText = updates.about.content || null;
      if (updates.about.features !== undefined) {
        // Convert features array to JSON string
        payload.aboutFeatures = JSON.stringify(updates.about.features || []);
      }
    }
    if (updates.contact) {
      if (updates.contact.address !== undefined)
        payload.officeAddress = updates.contact.address || null;
      // Remove non-digit characters from phone for validation
      if (updates.contact.phone !== undefined) {
        const phone = updates.contact.phone?.replace(/\D/g, "") || "";
        payload.officePhone = phone || null;
      }
      if (updates.contact.email !== undefined) {
        const email = updates.contact.email?.trim() || "";
        payload.officeEmail = email || null;
      }
      if (updates.contact.officeHours !== undefined)
        payload.officeHours = updates.contact.officeHours || null;
    }
    if (updates.logo !== undefined) {
      payload.logoUrl = updates.logo || null;
    }
    if (updates.basicInfo) {
      if (updates.basicInfo.population !== undefined)
        payload.population = updates.basicInfo.population || null;
      if (updates.basicInfo.area !== undefined)
        payload.area = updates.basicInfo.area || null;
      if (updates.basicInfo.wards !== undefined)
        payload.wards = updates.basicInfo.wards || null;
      if (updates.basicInfo.establishedYear !== undefined)
        payload.establishedYear = updates.basicInfo.establishedYear || null;
      if (updates.basicInfo.mapCoordinates !== undefined)
        payload.mapCoordinates = updates.basicInfo.mapCoordinates || null;
    }

    // Remove null/undefined values to allow partial updates
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    await settingsApi.update(payload);
    return await settingsAPI.get();
  },
  updateHero: async (
    hero: PanchayatSettings["hero"]
  ): Promise<PanchayatSettings> => {
    return await settingsAPI.update({ hero });
  },

  updateBasicInfo: async (
    basicInfo: PanchayatSettings["basicInfo"]
  ): Promise<PanchayatSettings> => {
    return await settingsAPI.update({ basicInfo });
  },
  updateAbout: async (
    about: PanchayatSettings["about"]
  ): Promise<PanchayatSettings> => {
    return await settingsAPI.update({ about });
  },
  updateContact: async (
    contact: PanchayatSettings["contact"]
  ): Promise<PanchayatSettings> => {
    return await settingsAPI.update({ contact });
  },
  uploadLogo: async (file: File): Promise<PanchayatSettings> => {
    const data = await settingsApi.uploadLogo(file);
    
    // Parse aboutFeatures JSON string to array
    let features: string[] = [];
    if (data.aboutFeatures) {
      try {
        features = JSON.parse(data.aboutFeatures);
        if (!Array.isArray(features)) {
          features = [];
        }
      } catch (e) {
        features = [];
      }
    }

    // Map backend response to frontend PanchayatSettings
    return {
      id: String(data.panchayatId),
      panchayatId: String(data.panchayatId),
      hero: {
        title: data.heroTitle || data.panchayatName || "",
        subtitle: data.heroSubtitle || data.district || "",
        description: data.description || "",
        image: data.heroImageUrl || undefined,
      },
      about: {
        title: data.aboutTitle || "About Us",
        content: data.aboutText || "",
        features: features,
      },
      contact: {
        address: data.officeAddress || data.address || "",
        phone: data.officePhone || data.contactPhone || "",
        email: data.officeEmail || data.contactEmail || "",
        officeHours: data.officeHours || "",
      },
      basicInfo: {
        population: data.population || undefined,
        area: data.area || "",
        wards: data.wards || undefined,
        establishedYear: data.establishedYear || undefined,
        mapCoordinates: data.mapCoordinates || "",
      },
      logo: data.logoUrl,
      themeId: data.themeId,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
  uploadHeroImage: async (file: File): Promise<PanchayatSettings> => {
    const data = await settingsApi.uploadHeroImage(file);
    
    // Parse aboutFeatures JSON string to array
    let features: string[] = [];
    if (data.aboutFeatures) {
      try {
        features = JSON.parse(data.aboutFeatures);
        if (!Array.isArray(features)) {
          features = [];
        }
      } catch (e) {
        features = [];
      }
    }

    // Map backend response to frontend PanchayatSettings
    return {
      id: String(data.panchayatId),
      panchayatId: String(data.panchayatId),
      hero: {
        title: data.heroTitle || data.panchayatName || "",
        subtitle: data.heroSubtitle || data.district || "",
        description: data.description || "",
        image: data.heroImageUrl || undefined,
      },
      about: {
        title: data.aboutTitle || "About Us",
        content: data.aboutText || "",
        features: features,
      },
      contact: {
        address: data.officeAddress || data.address || "",
        phone: data.officePhone || data.contactPhone || "",
        email: data.officeEmail || data.contactEmail || "",
        officeHours: data.officeHours || "",
      },
      basicInfo: {
        population: data.population || undefined,
        area: data.area || "",
        wards: data.wards || undefined,
        establishedYear: data.establishedYear || undefined,
        mapCoordinates: data.mapCoordinates || "",
      },
      logo: data.logoUrl,
      themeId: data.themeId,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
};

// Super Admin API - maps to admin APIs from routes/api.ts
export const superAdminAPI = {
  getAllPanchayats: async (params?: {
    status?: string;
    search?: string;
  }): Promise<SuperAdminPanchayat[]> => {
    const result = await adminPanchayatApi.getAll({
      status: params?.status,
      search: params?.search,
      page: 0,
      size: 1000,
    });
    return result.content.map((p: any) => ({
      id: String(p.panchayatId),
      panchayatName: p.panchayatName,
      slug: p.slug,
      district: p.district,
      state: p.state,
      status: (p.status?.toLowerCase() || "active") as PanchayatStatus,
      adminCount: 0, // Will be calculated from stats if needed
      createdAt: p.createdAt || new Date().toISOString(),
    }));
  },
  getPanchayatById: async (id: string): Promise<SuperAdminPanchayat> => {
    const p = await adminPanchayatApi.getById(parseInt(id));
    return {
      id: String(p.panchayatId),
      panchayatName: p.panchayatName,
      slug: p.slug,
      district: p.district,
      state: p.state,
      status: (p.status?.toLowerCase() || "active") as PanchayatStatus,
      adminCount: 0,
      createdAt: p.createdAt || new Date().toISOString(),
    };
  },
  createPanchayat: async (data: {
    panchayatName: string;
    slug: string;
    district: string;
    state: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    description?: string;
    customDomain?: string;
  }): Promise<SuperAdminPanchayat> => {
    const p = await adminPanchayatApi.create(data);
    return {
      id: String(p.panchayatId),
      panchayatName: p.panchayatName,
      slug: p.slug,
      district: p.district,
      state: p.state,
      status: (p.status?.toLowerCase() || "active") as PanchayatStatus,
      adminCount: 0,
      createdAt: p.createdAt || new Date().toISOString(),
    };
  },
  updatePanchayat: async (
    id: string,
    data: Partial<{
      panchayatName: string;
      slug: string;
      district: string;
      state: string;
      address?: string;
      contactPhone?: string;
      contactEmail?: string;
      description?: string;
      customDomain?: string;
    }>
  ): Promise<SuperAdminPanchayat> => {
    const p = await adminPanchayatApi.update(parseInt(id), data);
    return {
      id: String(p.panchayatId),
      panchayatName: p.panchayatName,
      slug: p.slug,
      district: p.district,
      state: p.state,
      status: (p.status?.toLowerCase() || "active") as PanchayatStatus,
      adminCount: 0,
      createdAt: p.createdAt || new Date().toISOString(),
    };
  },
  updatePanchayatStatus: async (id: string, status: string): Promise<void> => {
    await adminPanchayatApi.updateStatus(parseInt(id), status);
  },
  deletePanchayat: async (id: string): Promise<void> => {
    await adminPanchayatApi.delete(parseInt(id));
  },
  getAllUsers: async (): Promise<AdminUser[]> => {
    const result = await adminUserApi.getAll({ page: 0, size: 1000 });
    return result.content.map((u: any) => ({
      id: String(u.userId),
      name: u.name,
      email: u.email,
      role:
        u.role?.toLowerCase() === "super_admin"
          ? "super_admin"
          : "panchayat_admin",
      panchayatId: u.panchayatId ? String(u.panchayatId) : undefined,
      panchayatName: u.panchayatName,
      status: (u.status?.toLowerCase() || "active") as UserStatus,
      createdAt: u.createdAt || new Date().toISOString(),
      lastLogin: u.updatedAt,
    }));
  },
  updateUserStatus: async (id: string, status: string): Promise<void> => {
    await adminUserApi.updateStatus(parseInt(id), status);
  },
  getSystemAnalytics: async (): Promise<any> => {
    const analytics = await adminAnalyticsApi.getSystemAnalytics();
    return {
      totalPanchayats: analytics.totalPanchayats || 0,
      activePanchayats: analytics.activePanchayats || 0,
      totalUsers: analytics.totalUsers || 0,
      totalPosts: analytics.totalPosts || 0,
      totalSchemes: analytics.totalSchemes || 0,
    };
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const result = await adminAuditLogApi.getAll({ page: 0, size: 100 });
    return result.content.map((log: any) => ({
      id: String(log.id),
      userId: String(log.userId),
      userName: log.userName || "Unknown",
      action: log.actionType || "UNKNOWN",
      resource: log.targetEntityType || "Unknown",
      resourceId: log.targetEntityId ? String(log.targetEntityId) : "",
      details: log.changes || {},
      ipAddress: log.ipAddress,
      createdAt: log.createdAt || new Date().toISOString(),
    }));
  },
};

// Enhanced API exports for backward compatibility
export const authAPIEnhanced = authAPI;
export const postsAPIEnhanced = postsAPI;
export const announcementsAPIEnhanced = announcementsAPI;
export const schemesAPIEnhanced = schemesAPI;
export const galleryAPIEnhanced = galleryAPI;

// Export the axios instance for custom requests
export default api;
