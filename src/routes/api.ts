import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  Album,
  AnalyticsOverview,
  Announcement,
  Comment,
  EngagementStats,
  GalleryItem,
  PageView,
  PopularPost,
  Post,
  Scheme,
  TeamMember,
  UserStatus,
} from "@/types";

const DEFAULT_BASE_URL = "http://localhost:8080/api/v1";
const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  DEFAULT_BASE_URL
).replace(/\/$/, "");

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
};

const ensureBearer = (token: string) =>
  token.startsWith("Bearer ") ? token : `Bearer ${token}`;

class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = ensureBearer(token);
      }
      return config;
    });
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      const payload = response.data;

      if (payload?.success === false) {
        throw new Error(payload.message ?? "Request failed");
      }

      if (typeof payload?.data !== "undefined") {
        return payload.data;
      }

      return payload as unknown as T;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "GET", url, ...config });
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "POST", url, data, ...config });
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "PATCH", url, data, ...config });
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "DELETE", url, ...config });
  }

  private normalizeError(error: unknown) {
    if (axios.isAxiosError(error)) {
      return new Error(this.extractErrorMessage(error));
    }
    return error instanceof Error ? error : new Error("Unexpected error");
  }

  private extractErrorMessage(error: AxiosError) {
    if (error.response?.data && typeof error.response.data === "object") {
      const payload = error.response.data as ApiResponse<never> & {
        message?: string;
        error?: string;
      };
      return payload.message ?? payload.error ?? error.message;
    }
    return error.message || "Request failed";
  }
}

const httpClient = new HttpClient(API_BASE_URL);

/**
 * Auth API
 */
type ServerUser = {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: "SUPER_ADMIN" | "PANCHAYAT_ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  panchayatId?: number;
  panchayatName?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
};

type LoginResponseDTO = {
  token: string;
  tokenType: string;
  user: ServerUser;
};

class AuthApi {
  constructor(private http: HttpClient) {}

  login(payload: { email: string; password: string }) {
    return this.http.post<LoginResponseDTO>("/auth/login", payload);
  }

  logout() {
    return this.http.post("/auth/logout");
  }

  getCurrentUser() {
    return this.http.get<ServerUser>("/auth/me");
  }
}

/**
 * Posts API
 */
type ServerPost = {
  postId: number;
  title?: string;
  bodyText: string;
  mediaUrl?: string;
  status?: string;
  publishedAt?: string;
  viewCount?: number;
  likesCount?: number;
  commentsCount?: number;
  panchayatId?: number;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PostListParams = {
  pageNumber?: number;
  pageSize?: number;
  postStatus?: "DRAFT" | "PUBLISHED";
};

class PanchayatPostApi {
  constructor(private http: HttpClient) {}

  async list(params?: PostListParams): Promise<PaginatedResult<Post>> {
    const data = await this.http.get<PagedResponse<ServerPost>>("/panchayat/posts", {
      params,
    });
    return {
      items: data.content.map(mapPostResponse),
      page: data.page,
      size: data.size,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
      isFirst: data.first,
      isLast: data.last,
    };
  }

  async getById(id: string | number): Promise<Post> {
    const data = await this.http.get<ServerPost>(`/panchayat/posts/${id}`);
    return mapPostResponse(data);
  }

  async create(payload: { title?: string; bodyText: string; mediaUrl?: string }) {
    const data = await this.http.post<ServerPost>("/panchayat/posts", payload);
    return mapPostResponse(data);
  }

  async update(id: string | number, payload: { title?: string; bodyText: string; mediaUrl?: string }) {
    const data = await this.http.put<ServerPost>(`/panchayat/posts/${id}`, payload);
    return mapPostResponse(data);
  }

  publish(id: string | number) {
    return this.http.patch(`/panchayat/posts/${id}/publish`);
  }

  delete(id: string | number) {
    return this.http.delete(`/panchayat/posts/${id}`);
  }
}

/**
 * Comments API
 */
type ServerComment = {
  commentId: number;
  commenterName: string;
  commenterEmail?: string;
  bodyText: string;
  approvedFlag: boolean;
  postId: number;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatCommentApi {
  constructor(private http: HttpClient) {}

  async list(
    postId: string | number,
    options?: { approvedOnly?: boolean; pageNumber?: number; pageSize?: number },
  ): Promise<PaginatedResult<Comment>> {
    const data = await this.http.get<PagedResponse<ServerComment>>(
      `/panchayat/posts/${postId}/comments`,
      {
        params: {
          approvedOnly: options?.approvedOnly ?? false,
          page: options?.pageNumber,
          size: options?.pageSize,
        },
      },
    );

    return {
      items: data.content.map(mapCommentResponse),
      page: data.page,
      size: data.size,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
      isFirst: data.first,
      isLast: data.last,
    };
  }

  approve(postId: string | number, commentId: string | number) {
    return this.http.patch(`/panchayat/posts/${postId}/comments/${commentId}/approve`);
  }

  delete(postId: string | number, commentId: string | number) {
    return this.http.delete(`/panchayat/posts/${postId}/comments/${commentId}`);
  }
}

/**
 * Team API
 */
class PanchayatTeamApi {
  constructor(private http: HttpClient) {}

  async list(options?: { page?: number; size?: number }): Promise<PaginatedResult<TeamMember>> {
    const data = await this.http.get<PagedResponse<ServerUser>>("/panchayat/team", {
      params: {
        page: options?.page,
        size: options?.size,
      },
    });

    return {
      items: data.content.map(mapTeamMemberResponse),
      page: data.page,
      size: data.size,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
      isFirst: data.first,
      isLast: data.last,
    };
  }

  async addMember(payload: { name: string; email: string; phone: string; password: string }) {
    const data = await this.http.post<ServerUser>("/panchayat/team", payload);
    return mapTeamMemberResponse(data);
  }

  removeMember(userId: string | number) {
    return this.http.delete(`/panchayat/team/${userId}`);
  }

  updateStatus(userId: string | number, status: UserStatus) {
    return this.http.patch(`/panchayat/team/${userId}/status`, {
      status: status.toUpperCase(),
    });
  }
}

/**
 * Analytics Adapter (derived from posts)
 */
class AnalyticsAdapter {
  private cache = new Map<string, Post[]>();

  constructor(private postsApi: PanchayatPostApi) {}

  invalidate(panchayatId: string) {
    this.cache.delete(panchayatId);
  }

  private async getPosts(panchayatId: string) {
    if (this.cache.has(panchayatId)) {
      return this.cache.get(panchayatId)!;
    }

    const result = await this.postsApi.list({ pageSize: 100 });
    this.cache.set(panchayatId, result.items);
    return result.items;
  }

  async getOverview(panchayatId: string): Promise<AnalyticsOverview> {
    const posts = await this.getPosts(panchayatId);
    const totalVisitors = posts.reduce((sum, post) => sum + post.shares, 0);
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

    return {
      totalVisitors,
      activeSchemes: 0,
      announcements: 0,
      photoGallery: 0,
      totalPosts: posts.length,
      totalComments,
      totalLikes,
    };
  }

  async getPageViews(panchayatId: string): Promise<PageView[]> {
    const posts = await this.getPosts(panchayatId);
    const totalViews = posts.reduce((sum, post) => sum + post.shares, 0) || 1;
    const dailyViews: PageView[] = [];

    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const factor = 0.5 + Math.random();
      const views = Math.round((totalViews / 30) * factor);
      dailyViews.push({
        date: date.toISOString().split("T")[0],
        views,
        uniqueVisitors: Math.round(views * 0.6),
      });
    }

    return dailyViews;
  }

  async getPopularPosts(panchayatId: string): Promise<PopularPost[]> {
    const posts = await this.getPosts(panchayatId);
    return posts
      .map((post) => ({
        id: post.id,
        title: post.content.slice(0, 60) || post.id,
        views: post.shares,
        likes: post.likes,
        comments: post.comments,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }

  async getEngagement(panchayatId: string): Promise<EngagementStats> {
    const posts = await this.getPosts(panchayatId);
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

    return {
      totalLikes,
      totalComments,
      totalShares: posts.reduce((sum, post) => sum + post.shares, 0),
      averageEngagement: posts.length ? (totalLikes + totalComments) / posts.length : 0,
      topEngagedPosts: posts
        .map((post) => ({
          id: post.id,
          title: post.content.slice(0, 50) || post.id,
          views: post.shares,
          likes: post.likes,
          comments: post.comments,
        }))
        .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
        .slice(0, 5),
    };
  }
}

/**
 * Mapping helpers
 */
const mapPostResponse = (post: ServerPost): Post => ({
  id: String(post.postId),
  panchayatId: post.panchayatId ? String(post.panchayatId) : undefined,
  author: post.authorName ?? "Panchayat Sachiv",
  authorRole: "Panchayat Sachiv",
  timestamp: post.publishedAt ?? post.createdAt ?? new Date().toISOString(),
  content: post.bodyText ?? "",
  media: post.mediaUrl
    ? [
        {
          type: "image",
          url: post.mediaUrl,
        },
      ]
    : [],
  likes: Number(post.likesCount ?? 0),
  comments: Number(post.commentsCount ?? 0),
  shares: Number(post.viewCount ?? 0),
});

const mapCommentResponse = (comment: ServerComment): Comment => ({
  id: String(comment.commentId),
  postId: String(comment.postId),
  panchayatId: String(comment.postId),
  author: comment.commenterName,
  authorEmail: comment.commenterEmail ?? undefined,
  content: comment.bodyText,
  status: comment.approvedFlag ? "approved" : "pending",
  createdAt: comment.createdAt ?? new Date().toISOString(),
});

const mapTeamMemberResponse = (user: ServerUser): TeamMember => ({
  id: String(user.userId),
  panchayatId: user.panchayatId ? String(user.panchayatId) : "",
  name: user.name,
  email: user.email,
  role: user.role.replace("_", " "),
  status: (user.status?.toLowerCase() ?? "inactive") as UserStatus,
  createdAt: user.createdAt,
  lastActive: user.lastLogin,
});

/**
 * Schemes API
 */
type ServerScheme = {
  schemeId: number;
  title: string;
  description: string;
  eligibilityText?: string;
  documentUrls?: string[];
  status: "ACTIVE" | "ONGOING" | "COMPLETED" | "SUSPENDED";
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  budgetAmount?: number;
  beneficiaryCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatSchemeApi {
  constructor(private http: HttpClient) {}

  async list(): Promise<PaginatedResult<Scheme>> {
    try {
      const data = await this.http.get<PagedResponse<ServerScheme>>("/panchayat/schemes", {
        params: { page: 0, size: 100 },
      });
      return {
        items: data.content.map(mapSchemeResponse),
        page: data.page,
        size: data.size,
        totalItems: data.totalElements,
        totalPages: data.totalPages,
        isFirst: data.first,
        isLast: data.last,
      };
    } catch (error) {
      console.warn("Schemes API endpoint not available:", error);
      return {
        items: [],
        page: 0,
        size: 0,
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
      };
    }
  }

  async getById(id: string | number): Promise<Scheme> {
    const data = await this.http.get<ServerScheme>(`/panchayat/schemes/${id}`);
    return mapSchemeResponse(data);
  }

  async create(
    payload: {
      title: string;
      description: string;
      category?: string;
      budgetAmount?: number;
      beneficiaryCount?: number;
      eligibilityText?: string;
      documentUrls?: string[];
      contactPersonName?: string;
      contactPersonPhone?: string;
      contactPersonEmail?: string;
    },
  ) {
    const data = await this.http.post<ServerScheme>("/panchayat/schemes", {
      title: payload.title,
      description: payload.description || payload.category || "",
      budgetAmount: payload.budgetAmount,
      beneficiaryCount: payload.beneficiaryCount,
      eligibilityText: payload.eligibilityText,
      documentUrls: payload.documentUrls,
      contactPersonName: payload.contactPersonName,
      contactPersonPhone: payload.contactPersonPhone,
      contactPersonEmail: payload.contactPersonEmail,
    });
    return mapSchemeResponse(data);
  }

  async update(
    id: string | number,
    payload: Partial<{
      title: string;
      description: string;
      category?: string;
      budgetAmount?: number;
      beneficiaryCount?: number;
      eligibilityText?: string;
      documentUrls?: string[];
      contactPersonName?: string;
      contactPersonPhone?: string;
      contactPersonEmail?: string;
    }>,
  ) {
    const updatePayload: any = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.category !== undefined) updatePayload.description = payload.category;
    if (payload.budgetAmount !== undefined) updatePayload.budgetAmount = payload.budgetAmount;
    if (payload.beneficiaryCount !== undefined) updatePayload.beneficiaryCount = payload.beneficiaryCount;
    if (payload.eligibilityText !== undefined) updatePayload.eligibilityText = payload.eligibilityText;
    if (payload.documentUrls !== undefined) updatePayload.documentUrls = payload.documentUrls;
    if (payload.contactPersonName !== undefined) updatePayload.contactPersonName = payload.contactPersonName;
    if (payload.contactPersonPhone !== undefined) updatePayload.contactPersonPhone = payload.contactPersonPhone;
    if (payload.contactPersonEmail !== undefined) updatePayload.contactPersonEmail = payload.contactPersonEmail;

    const data = await this.http.put<ServerScheme>(`/panchayat/schemes/${id}`, updatePayload);
    return mapSchemeResponse(data);
  }

  async delete(id: string | number) {
    return await this.http.delete(`/panchayat/schemes/${id}`);
  }
}

/**
 * Announcements API
 */
type ServerAnnouncement = {
  announcementId: number;
  title: string;
  bodyText: string;
  attachments?: string[];
  startDate?: string;
  endDate?: string;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatAnnouncementApi {
  constructor(private http: HttpClient) {}

  async list(): Promise<PaginatedResult<Announcement>> {
    try {
      const data = await this.http.get<PagedResponse<ServerAnnouncement>>("/panchayat/announcements", {
        params: { page: 0, size: 100 },
      });
      return {
        items: data.content.map(mapAnnouncementResponse),
        page: data.page,
        size: data.size,
        totalItems: data.totalElements,
        totalPages: data.totalPages,
        isFirst: data.first,
        isLast: data.last,
      };
    } catch (error) {
      console.warn("Announcements API endpoint not available:", error);
      return {
        items: [],
        page: 0,
        size: 0,
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
      };
    }
  }

  async getById(id: string | number): Promise<Announcement> {
    const data = await this.http.get<ServerAnnouncement>(`/panchayat/announcements/${id}`);
    return mapAnnouncementResponse(data);
  }

  async create(
    payload: {
      title: string;
      bodyText: string;
      attachments?: string[];
      startDate?: string;
      endDate?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    const data = await this.http.post<ServerAnnouncement>("/panchayat/announcements", payload);
    return mapAnnouncementResponse(data);
  }

  async update(
    id: string | number,
    payload: Partial<{
      title: string;
      bodyText: string;
      attachments?: string[];
      startDate?: string;
      endDate?: string;
      priority?: number;
      isActive?: boolean;
    }>,
  ) {
    const data = await this.http.put<ServerAnnouncement>(`/panchayat/announcements/${id}`, payload);
    return mapAnnouncementResponse(data);
  }

  async delete( id: string | number) {
    return await this.http.delete(`/panchayat/announcements/${id}`);
  }
}

/**
 * Additional mapping helpers
 */
const mapSchemeResponse = (scheme: ServerScheme): Scheme => {
  // Calculate progress based on status
  let progress = 0;
  if (scheme.status === "ACTIVE") progress = 50;
  else if (scheme.status === "ONGOING") progress = 75;
  else if (scheme.status === "COMPLETED") progress = 100;
  else if (scheme.status === "SUSPENDED") progress = 0;

  // Map status
  let status: "Active" | "Completed" | "Pending" = "Pending";
  if (scheme.status === "ACTIVE" || scheme.status === "ONGOING") status = "Active";
  else if (scheme.status === "COMPLETED") status = "Completed";

  // Format budget
  const budget = scheme.budgetAmount
    ? `₹${scheme.budgetAmount.toLocaleString("en-IN")}`
    : "₹0";

  // Use description as category, or extract first part
  const category = scheme.description
    ? scheme.description.length > 50
      ? scheme.description.substring(0, 50) + "..."
      : scheme.description
    : "General";

  return {
  id: String(scheme.schemeId),
    panchayatId: undefined,
    name: scheme.title,
    category: category,
    budget: budget,
    beneficiaries: scheme.beneficiaryCount || 0,
    progress: progress,
    status: status,
  };
};

const mapAnnouncementResponse = (announcement: ServerAnnouncement): Announcement => ({
  id: String(announcement.announcementId),
  panchayatId: undefined,
  title: announcement.title,
  description: announcement.bodyText,
  date: announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString(),
  status: announcement.isActive ? "Published" : "Draft",
  views: 0,
});

/**
 * Albums API
 */
type ServerAlbum = {
  albumId: number;
  albumName: string;
  description?: string;
  coverImageUrl?: string;
  imageCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatAlbumApi {
  constructor(private http: HttpClient) {}

  async list(): Promise<PaginatedResult<Album>> {
    try {
      const data = await this.http.get<PagedResponse<ServerAlbum>>("/panchayat/albums", {
        params: { page: 0, size: 100 },
      });
      return {
        items: data.content.map(mapAlbumResponse),
        page: data.page,
        size: data.size,
        totalItems: data.totalElements,
        totalPages: data.totalPages,
        isFirst: data.first,
        isLast: data.last,
      };
    } catch (error) {
      console.warn("Albums API endpoint not available:", error);
      return {
        items: [],
        page: 0,
        size: 0,
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
      };
    }
  }

  async getById( id: string | number): Promise<Album> {
    const data = await this.http.get<ServerAlbum>(`/panchayat/albums/${id}`);
    return mapAlbumResponse(data);
  }

  async create(
    payload: {
      title: string;
      description?: string;
      coverImage?: string;
    },
  ) {
    const data = await this.http.post<ServerAlbum>("/panchayat/albums", {
      albumName: payload.title,
      description: payload.description,
      coverImageUrl: payload.coverImage,
    });
    return mapAlbumResponse(data);
  }

  async update(
    id: string | number,
    payload: Partial<{
      title: string;
      description?: string;
      coverImage?: string;
    }>,
  ) {
    const updatePayload: any = {};
    if (payload.title !== undefined) updatePayload.albumName = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.coverImage !== undefined) updatePayload.coverImageUrl = payload.coverImage;

    const data = await this.http.put<ServerAlbum>(`/panchayat/albums/${id}`, updatePayload);
    return mapAlbumResponse(data);
  }

  async delete(id: string | number) {
    return await this.http.delete(`/panchayat/albums/${id}`);
  }
}

/**
 * Gallery Images API
 */
type ServerGalleryImage = {
  imageId: number;
  imageUrl: string;
  caption?: string;
  tags?: string;
  albumId?: number;
  albumName?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatGalleryApi {
  constructor(private http: HttpClient) {}

  async list( albumId?: string | number): Promise<PaginatedResult<GalleryItem>> {
    try {
      const params: any = { page: 0, size: 100 };
      if (albumId) params.albumId = albumId;
      
      const data = await this.http.get<PagedResponse<ServerGalleryImage>>("/panchayat/gallery", {
        params,
      });
      return {
        items: data.content.map(mapGalleryImageResponse),
        page: data.page,
        size: data.size,
        totalItems: data.totalElements,
        totalPages: data.totalPages,
        isFirst: data.first,
        isLast: data.last,
      };
    } catch (error) {
      console.warn("Gallery API endpoint not available:", error);
      return {
        items: [],
        page: 0,
        size: 0,
        totalItems: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
      };
    }
  }

  async getById( id: string | number): Promise<GalleryItem> {
    const data = await this.http.get<ServerGalleryImage>(`/panchayat/gallery/${id}`);
    return mapGalleryImageResponse(data);
  }

  async create(
    payload: {
      imageUrl: string;
      caption?: string;
      tags?: string;
      albumId?: number;
      displayOrder?: number;
    },
  ) {
    const data = await this.http.post<ServerGalleryImage>("/panchayat/gallery", payload);
    return mapGalleryImageResponse(data);
  }

  async update(
    id: string | number,
    payload: Partial<{
      imageUrl: string;
      caption?: string;
      tags?: string;
      albumId?: number;
      displayOrder?: number;
    }>,
  ) {
    const data = await this.http.put<ServerGalleryImage>(`/panchayat/gallery/${id}`, payload);
    return mapGalleryImageResponse(data);
  }

  async delete( id: string | number) {
    return await this.http.delete(`/panchayat/gallery/${id}`);
  }
}

const mapAlbumResponse = (album: ServerAlbum): Album => ({
  id: String(album.albumId),
  panchayatId: "",
  title: album.albumName,
  description: album.description,
  coverImage: album.coverImageUrl,
  imageCount: album.imageCount || 0,
  createdAt: album.createdAt || new Date().toISOString(),
  updatedAt: album.updatedAt || new Date().toISOString(),
});

const mapGalleryImageResponse = (image: ServerGalleryImage): GalleryItem & { albumId?: number } => ({
  id: String(image.imageId),
  panchayatId: undefined,
  title: image.caption || "Gallery Image",
  image: image.imageUrl,
  description: image.caption,
  category: image.albumName,
  date: image.createdAt
    ? new Date(image.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString(),
  albumId: image.albumId,
});

/**
 * Settings API
 */
type ServerPanchayat = {
  panchayatId: number;
  panchayatName: string;
  slug: string;
  district: string;
  state: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  description?: string;
  aboutText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutTitle?: string;
  aboutFeatures?: string; // JSON array stored as string
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  mapCoordinates?: string;
  officeHours?: string;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatSettingsApi {
  constructor(private http: HttpClient) {}

  async get(): Promise<ServerPanchayat> {
    return await this.http.get<ServerPanchayat>("/panchayat/settings");
  }

  async update(payload: Partial<ServerPanchayat>): Promise<ServerPanchayat> {
    return await this.http.put<ServerPanchayat>("/panchayat/settings", payload);
  }
}

/**
 * Admin Panchayats API
 */
type ServerAdminPanchayat = {
  panchayatId: number;
  panchayatName: string;
  slug: string;
  district: string;
  state: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

class AdminPanchayatApi {
  constructor(private http: HttpClient) {}

  async getAll(params?: { status?: string; search?: string; page?: number; size?: number }): Promise<PagedResponse<ServerAdminPanchayat>> {
    const queryParams: any = {};
    if (params?.status && params.status !== "all") {
      queryParams.status = params.status.toUpperCase();
    }
    if (params?.search) {
      queryParams.searchQuery = params.search;
    }
    if (params?.page !== undefined) {
      queryParams.pageNumber = params.page;
    }
    if (params?.size !== undefined) {
      queryParams.pageSize = params.size;
    }
    return await this.http.get<PagedResponse<ServerAdminPanchayat>>("/admin/panchayats", { params: queryParams });
  }

  async getById(id: string | number): Promise<ServerAdminPanchayat> {
    return await this.http.get<ServerAdminPanchayat>(`/admin/panchayats/${id}`);
  }

  async create(payload: {
    panchayatName: string;
    slug: string;
    district: string;
    state: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    description?: string;
  }): Promise<ServerAdminPanchayat> {
    return await this.http.post<ServerAdminPanchayat>("/admin/panchayats", payload);
  }

  async update(id: string | number, payload: Partial<{
    panchayatName: string;
    slug: string;
    district: string;
    state: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    description?: string;
  }>): Promise<ServerAdminPanchayat> {
    return await this.http.put<ServerAdminPanchayat>(`/admin/panchayats/${id}`, payload);
  }

  async updateStatus(id: string | number, status: string): Promise<void> {
    await this.http.patch(`/admin/panchayats/${id}/status`, { status: status.toUpperCase() });
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`/admin/panchayats/${id}`);
  }
}

/**
 * Admin Users API
 */
type ServerAdminUser = {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  role: string;
  status: string;
  panchayatId?: number;
  panchayatName?: string;
  createdAt?: string;
  updatedAt?: string;
};

class AdminUserApi {
  constructor(private http: HttpClient) {}

  async getAll(params?: { role?: string; status?: string; page?: number; size?: number }): Promise<PagedResponse<ServerAdminUser>> {
    const queryParams: any = {};
    if (params?.role) queryParams.role = params.role;
    if (params?.status) queryParams.status = params.status.toUpperCase();
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    return await this.http.get<PagedResponse<ServerAdminUser>>("/admin/users", { params: queryParams });
  }

  async updateStatus(id: string | number, status: string): Promise<void> {
    await this.http.patch(`/admin/users/${id}/status`, { status: status.toUpperCase() });
  }
}

/**
 * Admin Analytics API
 */
type ServerSystemAnalytics = {
  totalPanchayats: number;
  activePanchayats: number;
  totalUsers: number;
  totalPosts: number;
  totalSchemes: number;
  totalAnnouncements: number;
  totalDocuments: number;
  totalGalleryImages: number;
};

class AdminAnalyticsApi {
  constructor(private http: HttpClient) {}

  async getSystemAnalytics(): Promise<ServerSystemAnalytics> {
    return await this.http.get<ServerSystemAnalytics>("/admin/analytics/system");
  }
}

/**
 * Admin Audit Logs API
 */
type ServerAuditLog = {
  id: number;
  userId: number;
  userName: string;
  panchayatId?: number;
  panchayatName?: string;
  actionType: string;
  targetEntityType?: string;
  targetEntityId?: number;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: string;
};

class AdminAuditLogApi {
  constructor(private http: HttpClient) {}

  async getAll(params?: { panchayatId?: number; actionType?: string; startDate?: string; endDate?: string; page?: number; size?: number }): Promise<PagedResponse<ServerAuditLog>> {
    const queryParams: any = {};
    if (params?.panchayatId) queryParams.panchayatId = params.panchayatId;
    if (params?.actionType) queryParams.actionType = params.actionType;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    return await this.http.get<PagedResponse<ServerAuditLog>>("/admin/audit-logs", { params: queryParams });
  }
}

export const authApi = new AuthApi(httpClient);
export const postApi = new PanchayatPostApi(httpClient);
export const commentApi = new PanchayatCommentApi(httpClient);
export const teamApi = new PanchayatTeamApi(httpClient);
export const schemeApi = new PanchayatSchemeApi(httpClient);
export const announcementApi = new PanchayatAnnouncementApi(httpClient);
export const albumApi = new PanchayatAlbumApi(httpClient);
export const galleryApi = new PanchayatGalleryApi(httpClient);
export const settingsApi = new PanchayatSettingsApi(httpClient);
export const analyticsAdapter = new AnalyticsAdapter(postApi);
export const adminPanchayatApi = new AdminPanchayatApi(httpClient);
export const adminUserApi = new AdminUserApi(httpClient);
export const adminAnalyticsApi = new AdminAnalyticsApi(httpClient);
export const adminAuditLogApi = new AdminAuditLogApi(httpClient);
export type AuthUserDTO = ServerUser;

