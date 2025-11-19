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
    const response = await api.post<any, ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<any, ApiResponse<User>>('/auth/me');
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/auth/change-password', data);
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<any, ApiResponse<User>>('/auth/update-profile', data);
    return response.data;
  },
};

// ============================================================================
// Public API
// ============================================================================
export const publicAPI = {
  getAllPanchayats: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Panchayat>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/public/panchayats', { params });
    return response.data;
  },

  getAllPanchayatsSimple: async (): Promise<Panchayat[]> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/public/panchayats', {
      params: { page: 0, size: 100 }
    });
    return response.data.content;
  },

  getPanchayatBySlug: async (slug: string): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(`/public/panchayats/slug/${slug}`);
    return response.data;
  },

  getHomePageData: async (slug: string): Promise<any> => {
    const response = await api.get<any, ApiResponse<any>>(`/public/${slug}/home`);
    return response.data;
  },

  getPublicPosts: async (slug: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>(`/public/${slug}/posts`, { params });
    return response.data;
  },

  getPublicPostById: async (slug: string, postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(`/public/${slug}/posts/${postId}`);
    return response.data;
  },

  getPublicPostComments: async (slug: string, postId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/public/${slug}/posts/${postId}/comments`, { params });
    return response.data;
  },

  addPublicComment: async (slug: string, postId: number, data: CreateCommentRequest): Promise<Comment> => {
    const response = await api.post<any, ApiResponse<Comment>>(`/public/${slug}/posts/${postId}/comments`, data);
    return response.data;
  },
};

// ============================================================================
// Panchayat Posts API (Authenticated)
// ============================================================================
export const postsAPI = {
  getAllPosts: async (params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Post>>>('/panchayat/posts', { params });
    return response.data;
  },

  // Compatibility alias for getAllPosts
  getAll: async (_panchayatId?: string): Promise<UIPost[]> => {
    const result = await postsAPI.getAllPosts();
    return result.content.map(convertPostToUI);
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<any, ApiResponse<Post>>(`/panchayat/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<any, ApiResponse<Post>>('/panchayat/posts', data);
    return response.data;
  },

  // Compatibility alias for createPost
  create: async (data: CreatePostRequest): Promise<UIPost> => {
    const result = await postsAPI.createPost(data);
    return convertPostToUI(result);
  },

  updatePost: async (postId: number, data: UpdatePostRequest): Promise<Post> => {
    const response = await api.put<any, ApiResponse<Post>>(`/panchayat/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/panchayat/posts/${postId}`);
  },

  // Compatibility alias for deletePost
  delete: async (postId: number | string): Promise<void> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    await postsAPI.deletePost(id);
  },

  publishPost: async (postId: number): Promise<Post> => {
    const response = await api.patch<any, ApiResponse<Post>>(`/panchayat/posts/${postId}/publish`);
    return response.data;
  },
};

// ============================================================================
// Post Comments API (Authenticated)
// ============================================================================
export const commentsAPI = {
  getPostComments: async (postId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/panchayat/posts/${postId}/comments`, { params });
    return response.data;
  },

  getAllComments: async (params?: { page?: number; size?: number }): Promise<Comment[]> => {
    // Mock implementation - get comments from all posts
    try {
      const postsResponse = await postsAPI.getAllPosts({ page: 0, size: 50 });
      const allComments: Comment[] = [];
      
      for (const post of postsResponse.content) {
        try {
          const commentsResponse = await commentsAPI.getPostComments(post.postId, { page: 0, size: 100 });
          allComments.push(...commentsResponse.content);
        } catch (error) {
          console.error(`Error fetching comments for post ${post.postId}:`, error);
        }
      }
      
      return allComments;
    } catch (error) {
      console.error('Error fetching all comments:', error);
      return [];
    }
  },

  // Compatibility alias for getPostComments
  getByPost: async (postId: number | string): Promise<UIComment[]> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    const result = await commentsAPI.getPostComments(id);
    return result.content.map(convertCommentToUI);
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/panchayat/posts/${postId}/comments/${commentId}`);
  },

  // Compatibility alias for deleteComment
  delete: async (postId: number | string, commentId: number): Promise<void> => {
    const id = typeof postId === 'string' ? parseInt(postId) : postId;
    await commentsAPI.deleteComment(id, commentId);
  },

  approveComment: async (postId: number, commentId: number): Promise<Comment> => {
    const response = await api.patch<any, ApiResponse<Comment>>(`/panchayat/posts/${postId}/comments/${commentId}/approve`);
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
    const response = await api.get<any, ApiResponse<PaginatedResponse<TeamMember>>>('/panchayat/team', { params });
    return response.data;
  },

  // Compatibility alias for getTeamMembers
  getAllMembers: async (_panchayatId?: string): Promise<UITeamMember[]> => {
    const result = await teamAPI.getTeamMembers();
    return result.content.map(convertTeamMemberToUI);
  },

  addTeamMember: async (data: AddTeamMemberRequest): Promise<TeamMember> => {
    const response = await api.post<any, ApiResponse<TeamMember>>('/panchayat/team', data);
    return response.data;
  },

  // Compatibility alias for addTeamMember
  addMember: async (_panchayatId: string, data: AddTeamMemberRequest): Promise<TeamMember> => {
    return await teamAPI.addTeamMember(data);
  },

  removeTeamMember: async (userId: number): Promise<void> => {
    await api.delete(`/panchayat/team/${userId}`);
  },

  // Compatibility alias for removeTeamMember
  removeMember: async (userId: number | string): Promise<void> => {
    const id = typeof userId === 'string' ? parseInt(userId) : userId;
    await teamAPI.removeTeamMember(id);
  },

  updateTeamMemberStatus: async (userId: number, status: string): Promise<TeamMember> => {
    const response = await api.patch<any, ApiResponse<TeamMember>>(`/panchayat/team/${userId}/status`, { status });
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
    const response = await api.get<any, ApiResponse<PaginatedResponse<Panchayat>>>('/admin/panchayats', { params });
    return response.data;
  },

  getPanchayatById: async (panchayatId: number): Promise<Panchayat> => {
    const response = await api.get<any, ApiResponse<Panchayat>>(`/admin/panchayats/${panchayatId}`);
    return response.data;
  },

  createPanchayat: async (data: CreatePanchayatRequest): Promise<Panchayat> => {
    const response = await api.post<any, ApiResponse<Panchayat>>('/admin/panchayats', data);
    return response.data;
  },

  updatePanchayat: async (panchayatId: number, data: Partial<CreatePanchayatRequest>): Promise<Panchayat> => {
    const response = await api.put<any, ApiResponse<Panchayat>>(`/admin/panchayats/${panchayatId}`, data);
    return response.data;
  },

  deletePanchayat: async (panchayatId: number): Promise<void> => {
    await api.delete(`/admin/panchayats/${panchayatId}`);
  },

  updatePanchayatStatus: async (panchayatId: number, status: string): Promise<Panchayat> => {
    const response = await api.patch<any, ApiResponse<Panchayat>>(`/admin/panchayats/${panchayatId}/status`, { status });
    return response.data;
  },

  getPanchayatStats: async (panchayatId: number): Promise<PanchayatStats> => {
    const response = await api.get<any, ApiResponse<PanchayatStats>>(`/admin/panchayats/${panchayatId}/stats`);
    return response.data;
  },
};

// ============================================================================
// Backward Compatibility Wrappers
// These maintain compatibility with existing code that uses the old API structure
// ============================================================================

// Remove or comment out this duplicate re-declaration:
// export const postsAPI = { ... }
// ... if any usage expects another export, use the first postsAPI

// ============================================================================
// Post Comments API (Authenticated)
// ============================================================================
export const commentsAPI2 = {
  getPostComments: async (postId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<Comment>>>(`/panchayat/posts/${postId}/comments`, { params });
    return response.data;
  },

  getAllComments: async (params?: { page?: number; size?: number }): Promise<Comment[]> => {
    // Mock implementation - get comments from all posts
    try {
      const postsResponse = await postsAPI.getAllPosts({ page: 0, size: 50 });
      const allComments: Comment[] = [];
      
      for (const post of postsResponse.content) {
        try {
          const commentsResponse = await commentsAPI.getPostComments(post.postId, { page: 0, size: 100 });
          allComments.push(...commentsResponse.content);
        } catch (error) {
          console.error(`Error fetching comments for post ${post.postId}:`, error);
        }
      }
      
      return allComments;
    } catch (error) {
      console.error('Error fetching all comments:', error);
      return [];
    }
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/panchayat/posts/${postId}/comments/${commentId}`);
  },

  approveComment: async (postId: number, commentId: number): Promise<Comment> => {
    const response = await api.patch<any, ApiResponse<Comment>>(`/panchayat/posts/${postId}/comments/${commentId}/approve`);
    return response.data;
  },
};

// ============================================================================
// Team Management API
// ============================================================================
export const teamAPI2 = {
  getTeamMembers: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<TeamMember>> => {
    const response = await api.get<any, ApiResponse<PaginatedResponse<TeamMember>>>('/panchayat/team', { params });
    return response.data;
  },

  addTeamMember: async (data: AddTeamMemberRequest): Promise<TeamMember> => {
    const response = await api.post<any, ApiResponse<TeamMember>>('/panchayat/team', data);
    return response.data;
  },

  removeTeamMember: async (userId: number): Promise<void> => {
    await api.delete(`/panchayat/team/${userId}`);
  },

  updateTeamMemberStatus: async (userId: number, status: string): Promise<TeamMember> => {
    const response = await api.patch<any, ApiResponse<TeamMember>>(`/panchayat/team/${userId}/status`, { status });
    return response.data;
  },
};

// ============================================================================
// Announcements API (Mock - Add to backend later)
// ============================================================================
export const announcementsAPI = {
  getAll: async (panchayatId: string): Promise<any[]> => {
    // Mock data stored in localStorage
    const key = `announcements_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  create: async (panchayatId: string, data: any): Promise<any> => {
    const announcements = await announcementsAPI.getAll(panchayatId);
    const newAnnouncement = {
      id: Date.now().toString(),
      ...data,
      date: new Date().toISOString().split('T')[0],
      views: 0,
      panchayatId
    };
    announcements.unshift(newAnnouncement);
    localStorage.setItem(`announcements_${panchayatId}`, JSON.stringify(announcements));
    return newAnnouncement;
  },

  update: async (panchayatId: string, id: string, updates: any): Promise<any> => {
    const announcements = await announcementsAPI.getAll(panchayatId);
    const index = announcements.findIndex(a => a.id === id);
    if (index !== -1) {
      announcements[index] = { ...announcements[index], ...updates };
      localStorage.setItem(`announcements_${panchayatId}`, JSON.stringify(announcements));
      return announcements[index];
    }
    throw new Error('Announcement not found');
  },

  delete: async (panchayatId: string, id: string): Promise<void> => {
    const announcements = await announcementsAPI.getAll(panchayatId);
    const filtered = announcements.filter(a => a.id !== id);
    localStorage.setItem(`announcements_${panchayatId}`, JSON.stringify(filtered));
  },
};

// ============================================================================
// Schemes API (Mock - Add to backend later)
// ============================================================================
export const schemesAPI = {
  getAll: async (panchayatId: string): Promise<any[]> => {
    const key = `schemes_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  create: async (panchayatId: string, data: any): Promise<any> => {
    const schemes = await schemesAPI.getAll(panchayatId);
    const newScheme = {
      id: Date.now().toString(),
      ...data,
      progress: 0,
      panchayatId
    };
    schemes.unshift(newScheme);
    localStorage.setItem(`schemes_${panchayatId}`, JSON.stringify(schemes));
    return newScheme;
  },

  update: async (panchayatId: string, id: string, updates: any): Promise<any> => {
    const schemes = await schemesAPI.getAll(panchayatId);
    const index = schemes.findIndex(s => s.id === id);
    if (index !== -1) {
      schemes[index] = { ...schemes[index], ...updates };
      localStorage.setItem(`schemes_${panchayatId}`, JSON.stringify(schemes));
      return schemes[index];
    }
    throw new Error('Scheme not found');
  },

  delete: async (panchayatId: string, id: string): Promise<void> => {
    const schemes = await schemesAPI.getAll(panchayatId);
    const filtered = schemes.filter(s => s.id !== id);
    localStorage.setItem(`schemes_${panchayatId}`, JSON.stringify(filtered));
  },
};

// ============================================================================
// Gallery API (Mock - Add to backend later)
// ============================================================================
export const galleryAPI = {
  getAll: async (panchayatId: string): Promise<any[]> => {
    const key = `gallery_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  upload: async (panchayatId: string, file: File, data: any): Promise<any> => {
    const gallery = await galleryAPI.getAll(panchayatId);
    // Convert file to base64 for storage
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    
    const newItem = {
      id: Date.now().toString(),
      url: base64,
      title: data.title || file.name,
      date: new Date().toISOString().split('T')[0],
      category: data.category || 'General',
      panchayatId
    };
    gallery.unshift(newItem);
    localStorage.setItem(`gallery_${panchayatId}`, JSON.stringify(gallery));
    return newItem;
  },

  delete: async (panchayatId: string, id: string): Promise<void> => {
    const gallery = await galleryAPI.getAll(panchayatId);
    const filtered = gallery.filter(g => g.id !== id);
    localStorage.setItem(`gallery_${panchayatId}`, JSON.stringify(filtered));
  },
};

// ============================================================================
// Albums API (Mock - Add to backend later)
// ============================================================================
export const albumsAPI = {
  getAll: async (panchayatId: string): Promise<any[]> => {
    const key = `albums_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  create: async (panchayatId: string, data: any): Promise<any> => {
    const albums = await albumsAPI.getAll(panchayatId);
    const newAlbum = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      cover: '/api/placeholder/400/300',
      photoCount: 0,
      date: new Date().toISOString().split('T')[0],
      photos: [],
      panchayatId
    };
    albums.unshift(newAlbum);
    localStorage.setItem(`albums_${panchayatId}`, JSON.stringify(albums));
    return newAlbum;
  },

  update: async (panchayatId: string, id: string, updates: any): Promise<any> => {
    const albums = await albumsAPI.getAll(panchayatId);
    const index = albums.findIndex(a => a.id === id);
    if (index !== -1) {
      albums[index] = { ...albums[index], ...updates };
      localStorage.setItem(`albums_${panchayatId}`, JSON.stringify(albums));
      return albums[index];
    }
    throw new Error('Album not found');
  },

  delete: async (panchayatId: string, id: string): Promise<void> => {
    const albums = await albumsAPI.getAll(panchayatId);
    const filtered = albums.filter(a => a.id !== id);
    localStorage.setItem(`albums_${panchayatId}`, JSON.stringify(filtered));
  },

  addPhoto: async (panchayatId: string, albumId: string, file: File): Promise<any> => {
    const albums = await albumsAPI.getAll(panchayatId);
    const album = albums.find(a => a.id === albumId);
    if (!album) throw new Error('Album not found');

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const photo = {
      id: Date.now().toString(),
      url: base64,
      title: file.name,
      date: new Date().toISOString().split('T')[0]
    };

    album.photos = album.photos || [];
    album.photos.push(photo);
    album.photoCount = album.photos.length;
    album.cover = album.photos[0]?.url || album.cover;

    localStorage.setItem(`albums_${panchayatId}`, JSON.stringify(albums));
    return album;
  },
};

// ============================================================================
// Documents API (Mock - Add to backend later)
// ============================================================================
export const documentsAPI = {
  getAll: async (panchayatId: string): Promise<any[]> => {
    const key = `documents_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  upload: async (panchayatId: string, file: File, data: any): Promise<any> => {
    const documents = await documentsAPI.getAll(panchayatId);
    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      category: data.category || 'General',
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadDate: new Date().toISOString().split('T')[0],
      type: file.type,
      panchayatId
    };
    documents.unshift(newDoc);
    localStorage.setItem(`documents_${panchayatId}`, JSON.stringify(documents));
    return newDoc;
  },

  delete: async (panchayatId: string, id: string): Promise<void> => {
    const documents = await documentsAPI.getAll(panchayatId);
    const filtered = documents.filter(d => d.id !== id);
    localStorage.setItem(`documents_${panchayatId}`, JSON.stringify(filtered));
  },
};

// ============================================================================
// Settings API (Mock - Add to backend later)
// ============================================================================
export const settingsAPI = {
  get: async (panchayatId: string): Promise<any> => {
    const key = `settings_${panchayatId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {
      panchayatName: 'Gram Panchayat',
      heroTitle: 'Welcome to Our Panchayat',
      heroSubtitle: 'Building a better tomorrow together',
      aboutText: 'Our panchayat is committed to serving our community...',
      contactEmail: 'contact@panchayat.gov.in',
      contactPhone: '+91 1234567890',
      contactAddress: 'Village Office, District',
      officeHours: 'Mon-Fri: 9:00 AM - 5:00 PM'
    };
  },

  update: async (panchayatId: string, updates: any): Promise<any> => {
    const settings = await settingsAPI.get(panchayatId);
    const updated = { ...settings, ...updates };
    localStorage.setItem(`settings_${panchayatId}`, JSON.stringify(updated));
    return updated;
  },
};

// ============================================================================
// Analytics API (Mock - Add to backend later)
// ============================================================================
export const analyticsAPI = {
  getOverview: async (panchayatId: string): Promise<any> => {
    const posts = await postsAPI.getAllPosts({ page: 0, size: 100 });
    const announcements = await announcementsAPI.getAll(panchayatId);
    const schemes = await schemesAPI.getAll(panchayatId);
    const gallery = await galleryAPI.getAll(panchayatId);

    return {
      totalVisitors: posts.content.reduce((sum, post) => sum + (post.likesCount || 0), 0),
      activeSchemes: schemes.length,
      announcements: announcements.length,
      photoGallery: gallery.length,
      totalPosts: posts.totalElements,
      totalComments: posts.content.reduce((sum, post) => sum + (post.commentsCount || 0), 0),
      totalLikes: posts.content.reduce((sum, post) => sum + (post.likesCount || 0), 0),
    };
  },
};

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


// Enhanced API exports for backward compatibility
export const authAPIEnhanced = authAPI;
export const postsAPIEnhanced = postsAPI;
export const announcementsAPIEnhanced = announcementsAPI;
export const schemesAPIEnhanced = schemesAPI;
export const galleryAPIEnhanced = galleryAPI;

// Export the axios instance for custom requests
export default api;

