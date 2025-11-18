/**
 * API Service Layer
 * Handles all API calls to the egram backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
} from '../types/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://egram-backend-5g58.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Authentication API
// ============================================================================
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>('/api/v1/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>('/api/v1/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<any, ApiResponse<User>>('/api/v1/auth/me');
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/api/v1/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/api/v1/auth/reset-password', data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/api/v1/auth/change-password', data);
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<any, ApiResponse<User>>('/api/v1/auth/update-profile', data);
    return response.data;
  },
};

// ============================================================================
// Public API
// ============================================================================
export const publicAPI = {
  getAllPanchayats: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Panchayat>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/api/v1/public/panchayats', { params });
    return response.data;
  },

  getAllPanchayatsSimple: async (): Promise<Panchayat[]> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/api/v1/public/panchayats', {
      params: { page: 0, size: 100 }
    });
    return response.data.content;
  },

  getPanchayatBySlug: async (slug: string): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(`/api/v1/public/panchayats/slug/${slug}`);
    return response.data;
  },

  getHomePageData: async (slug: string): Promise<any> => {
    const response = await api.get<any, ApiResponse<any>>(`/api/v1/public/${slug}/home`);
    return response.data;
  },

  getPublicPosts: async (slug: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>(`/api/v1/public/${slug}/posts`, { params });
    return response.data;
  },

  getPublicPostById: async (slug: string, postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(`/api/v1/public/${slug}/posts/${postId}`);
    return response.data;
  },

  getPublicPostComments: async (slug: string, postId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/api/v1/public/${slug}/posts/${postId}/comments`, { params });
    return response.data;
  },

  addPublicComment: async (slug: string, postId: number, data: CreateCommentRequest): Promise<Comment> => {
    const response = await api.post<any, ApiResponse<Comment>>(`/api/v1/public/${slug}/posts/${postId}/comments`, data);
    return response.data;
  },
};

// ============================================================================
// Panchayat Posts API (Authenticated)
// ============================================================================
export const postsAPI = {
  getAllPosts: async (params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>('/api/v1/panchayat/posts', { params });
    return response.data;
  },

  // Compatibility alias for getAllPosts
  getAll: async (_panchayatId?: string): Promise<UIPost[]> => {
    const result = await postsAPI.getAllPosts();
    return result.content.map(convertPostToUI);
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(`/api/v1/panchayat/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<any, ApiResponse<Post>>('/api/v1/panchayat/posts', data);
    return response.data;
  },

  // Compatibility alias for createPost
  create: async (data: CreatePostRequest): Promise<UIPost> => {
    const result = await postsAPI.createPost(data);
    return convertPostToUI(result);
  },

  updatePost: async (postId: number, data: UpdatePostRequest): Promise<Post> => {
    const response = await api.put<any, ApiResponse<Post>>(`/api/v1/panchayat/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/api/v1/panchayat/posts/${postId}`);
  },

  // Compatibility alias for deletePost
  delete: async (postId: number | string): Promise<void> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    await postsAPI.deletePost(id);
  },

  publishPost: async (postId: number): Promise<Post> => {
    const response = await api.patch<any, ApiResponse<Post>>(`/api/v1/panchayat/posts/${postId}/publish`);
    return response.data;
  },
};

// ============================================================================
// Post Comments API (Authenticated)
// ============================================================================
export const commentsAPI = {
  getPostComments: async (postId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/api/v1/panchayat/posts/${postId}/comments`, { params });
    return response.data;
  },

  // Compatibility alias for getPostComments
  getByPost: async (postId: number | string): Promise<UIComment[]> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    const result = await commentsAPI.getPostComments(id);
    return result.content.map(convertCommentToUI);
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/api/v1/panchayat/posts/${postId}/comments/${commentId}`);
  },

  // Compatibility alias for deleteComment
  delete: async (postId: number | string, commentId: number): Promise<void> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    await commentsAPI.deleteComment(id, commentId);
  },

  approveComment: async (postId: number, commentId: number): Promise<Comment> => {
    const response = await api.patch<any, ApiResponse<Comment>>(`/api/v1/panchayat/posts/${postId}/comments/${commentId}/approve`);
    return response.data;
  },

  // Compatibility alias for approveComment
  approve: async (postId: number | string, commentId: number): Promise<UIComment> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    const result = await commentsAPI.approveComment(id, commentId);
    return convertCommentToUI(result);
  },
};

// ============================================================================
// Team Management API
// ============================================================================
export const teamAPI = {
  getTeamMembers: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<TeamMember>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<TeamMember>>>('/api/v1/panchayat/team', { params });
    return response.data;
  },

  // Compatibility alias for getTeamMembers
  getAllMembers: async (_panchayatId?: string): Promise<UITeamMember[]> => {
    const result = await teamAPI.getTeamMembers();
    return result.content.map(convertTeamMemberToUI);
  },

  addTeamMember: async (data: AddTeamMemberRequest): Promise<TeamMember> => {
    const response = await api.post<any, ApiResponse<TeamMember>>('/api/v1/panchayat/team', data);
    return response.data;
  },

  // Compatibility alias for addTeamMember
  addMember: async (_panchayatId: string, data: AddTeamMemberRequest): Promise<TeamMember> => {
    return await teamAPI.addTeamMember(data);
  },

  removeTeamMember: async (userId: number): Promise<void> => {
    await api.delete(`/api/v1/panchayat/team/${userId}`);
  },

  // Compatibility alias for removeTeamMember
  removeMember: async (userId: number | string): Promise<void> => {
    const id = typeof userId === 'string' ? parseInt(userId) : userId;
    await teamAPI.removeTeamMember(id);
  },

  updateTeamMemberStatus: async (userId: number, status: string): Promise<TeamMember> => {
    const response = await api.patch<any, ApiResponse<TeamMember>>(`/api/v1/panchayat/team/${userId}/status`, { status });
    return response.data;
  },

  // Compatibility alias for updateTeamMemberStatus
  updateMemberStatus: async (userId: number | string, status: string): Promise<UITeamMember> => {
    const id = typeof userId === 'string' ? parseInt(userId) : userId;
    const result = await teamAPI.updateTeamMemberStatus(id, status);
    return convertTeamMemberToUI(result);
  },
};

// ============================================================================
// Admin Panchayats API
// ============================================================================
export const adminPanchayatsAPI = {
  getAllPanchayats: async (params?: { page?: number; size?: number; status?: string; district?: string; state?: string }): Promise<PaginatedResponse<Panchayat>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/api/v1/admin/panchayats', { params });
    return response.data;
  },

  getPanchayatById: async (panchayatId: number): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(`/api/v1/admin/panchayats/${panchayatId}`);
    return response.data;
  },

  createPanchayat: async (data: CreatePanchayatRequest): Promise<Panchayat> => {
    const response = await api.post<any, ApiResponse<Panchayat>>('/api/v1/admin/panchayats', data);
    return response.data;
  },

  updatePanchayat: async (panchayatId: number, data: Partial<CreatePanchayatRequest>): Promise<Panchayat> => {
    const response = await api.put<any, ApiResponse<Panchayat>>(`/api/v1/admin/panchayats/${panchayatId}`, data);
    return response.data;
  },

  deletePanchayat: async (panchayatId: number): Promise<void> => {
    await api.delete(`/api/v1/admin/panchayats/${panchayatId}`);
  },

  updatePanchayatStatus: async (panchayatId: number, status: string): Promise<Panchayat> => {
    const response = await api.patch<any, ApiResponse<Panchayat>>(`/api/v1/admin/panchayats/${panchayatId}/status`, { status });
    return response.data;
  },

  getPanchayatStats: async (panchayatId: number): Promise<PanchayatStats> => {
    const response = await api.get<any, ApiResponse<PanchayatStats>>(`/api/v1/admin/panchayats/${panchayatId}/stats`);
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
} from '../types';

// Type conversion helpers
const convertPostToUI = (apiPost: Post): UIPost => ({
  id: apiPost.postId.toString(),
  panchayatId: apiPost.panchayatId.toString(),
  author: apiPost.authorName,
  authorRole: 'Sachiv',
  timestamp: apiPost.createdAt,
  content: apiPost.bodyText,
  media: apiPost.mediaUrl ? [{ type: 'image', url: apiPost.mediaUrl }] : [],
  likes: apiPost.likesCount,
  comments: apiPost.commentsCount,
  shares: 0,
});

const convertCommentToUI = (apiComment: Comment): UIComment => ({
  id: apiComment.commentId.toString(),
  postId: apiComment.postId.toString(),
  panchayatId: '',
  author: apiComment.commenterName,
  authorEmail: apiComment.commenterEmail,
  content: apiComment.bodyText,
  status: apiComment.approvedFlag ? 'approved' : 'pending',
  createdAt: apiComment.createdAt,
});

const convertTeamMemberToUI = (apiMember: TeamMember): UITeamMember => ({
  id: apiMember.userId.toString(),
  panchayatId: apiMember.panchayatId.toString(),
  name: apiMember.name,
  email: apiMember.email,
  role: apiMember.role,
  status: apiMember.status.toLowerCase() as 'active' | 'inactive' | 'suspended',
  createdAt: apiMember.createdAt,
  lastActive: apiMember.lastLogin,
});

// Panchayat API - compatibility wrapper
export const panchayatAPI = {
  getAll: async (): Promise<ActivePanchayat[]> => {
    const panchayats = await publicAPI.getAllPanchayatsSimple();
    return panchayats.map(p => ({
      id: p.panchayatId.toString(),
      name: p.panchayatName,
      district: p.district,
      state: p.state,
      subdomain: p.slug,
      population: 0,
      area: '0',
      wards: 0,
      established: new Date(p.createdAt).getFullYear(),
      status: p.status as any,
      schemes: 0,
    }));
  },

  getBySlug: async (slug: string): Promise<PanchayatDetails> => {
    const panchayat = await publicAPI.getPanchayatBySlug(slug);
    return {
      id: panchayat.panchayatId.toString(),
      name: panchayat.panchayatName,
      district: panchayat.district,
      state: panchayat.state,
      block: '',
      population: 0,
      area: '0',
      wards: 0,
      subdomain: panchayat.slug,
      established: new Date(panchayat.createdAt).getFullYear(),
      description: panchayat.description || '',
      heroImage: panchayat.heroImageUrl,
      contactInfo: {
        address: panchayat.address || '',
        phone: panchayat.contactPhone || '',
        email: panchayat.contactEmail || '',
        officeHours: '',
      },
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
      panchayatSlug: formData.subdomain,
      password: formData.password,
      phone: formData.phone,
    };

    return await authAPI.register(registerData);
  },
};

// Schemes API - placeholder (not in backend yet)
export const schemesAPI = {
  getAll: async (_panchayatId?: string): Promise<Scheme[]> => {
    return [];
  },
  create: async (_panchayatId: string, _data: Omit<Scheme, 'id'>): Promise<Scheme> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_id: string, _updates: Partial<Scheme>): Promise<Scheme> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Announcements API - placeholder (not in backend yet)
export const announcementsAPI = {
  getAll: async (_panchayatId?: string): Promise<Announcement[]> => {
    return [];
  },
  create: async (_panchayatId: string, _data: Omit<Announcement, 'id'>): Promise<Announcement> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_id: string, _updates: Partial<Announcement>): Promise<Announcement> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Members API - placeholder (not in backend yet)
export const membersAPI = {
  getAll: async (_panchayatId?: string): Promise<PanchayatMember[]> => {
    return [];
  },
  create: async (_panchayatId: string, _data: Omit<PanchayatMember, 'id'>): Promise<PanchayatMember> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_id: string, _updates: Partial<PanchayatMember>): Promise<PanchayatMember> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Gallery API - placeholder (not in backend yet)
export const galleryAPI = {
  getAll: async (_panchayatId?: string): Promise<GalleryItem[]> => {
    return [];
  },
  create: async (_panchayatId: string, _data: Omit<GalleryItem, 'id'>): Promise<GalleryItem> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_id: string, _updates: Partial<GalleryItem>): Promise<GalleryItem> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Projects API - placeholder (not in backend yet)
export const projectsAPI = {
  getAll: async (_panchayatId?: string): Promise<Project[]> => {
    return [];
  },
  create: async (_panchayatId: string, _data: Omit<Project, 'id'>): Promise<Project> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_id: string, _updates: Partial<Project>): Promise<Project> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
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

// Documents API - placeholder (not in backend yet)
export const documentsAPI = {
  upload: async (_panchayatId: string, _file: File, _data: any): Promise<Document> => {
    throw new Error('Not implemented in backend yet');
  },
  getAll: async (_panchayatId: string): Promise<Document[]> => {
    return [];
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Albums API - placeholder (not in backend yet)
export const albumsAPI = {
  create: async (_panchayatId: string, _data: any): Promise<Album> => {
    throw new Error('Not implemented in backend yet');
  },
  getAll: async (_panchayatId: string): Promise<Album[]> => {
    return [];
  },
  update: async (_id: string, _updates: any): Promise<Album> => {
    throw new Error('Not implemented in backend yet');
  },
  delete: async (_id: string): Promise<void> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Settings API - placeholder (not in backend yet)
export const settingsAPI = {
  get: async (_panchayatId: string): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  update: async (_panchayatId: string, _updates: Partial<PanchayatSettings>): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  updateHero: async (_panchayatId: string, _hero: any): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  updateAbout: async (_panchayatId: string, _about: any): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  updateContact: async (_panchayatId: string, _contact: any): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  uploadLogo: async (_panchayatId: string, _file: File): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
  uploadHeroImage: async (_panchayatId: string, _file: File): Promise<PanchayatSettings> => {
    throw new Error('Not implemented in backend yet');
  },
};

// Super Admin API - maps to adminPanchayatsAPI
export const superAdminAPI = {
  createPanchayat: async (data: any): Promise<any> => {
    return await adminPanchayatsAPI.createPanchayat(data);
  },
  updatePanchayat: async (id: string, updates: any): Promise<any> => {
    return await adminPanchayatsAPI.updatePanchayat(parseInt(id), updates);
  },
  updatePanchayatStatus: async (id: string, status: string): Promise<any> => {
    return await adminPanchayatsAPI.updatePanchayatStatus(parseInt(id), status);
  },
  deletePanchayat: async (id: string): Promise<void> => {
    await adminPanchayatsAPI.deletePanchayat(parseInt(id));
  },
  getAllPanchayats: async (params?: { status?: string; search?: string }): Promise<any[]> => {
    const result = await adminPanchayatsAPI.getAllPanchayats(params);
    return result.content;
  },
  getAllUsers: async (): Promise<any[]> => {
    // Placeholder - not implemented in backend yet
    return [];
  },
  updateUserStatus: async (id: string, status: string): Promise<void> => {
    // Placeholder - not implemented in backend yet
    console.log('updateUserStatus not implemented', id, status);
  },
  getSystemAnalytics: async (): Promise<any> => {
    // Placeholder - not implemented in backend yet
    return {
      totalPanchayats: 0,
      totalUsers: 0,
      activePanchayats: 0,
      totalPosts: 0,
    };
  },
  getAuditLogs: async (): Promise<any[]> => {
    // Placeholder - not implemented in backend yet
    return [];
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

