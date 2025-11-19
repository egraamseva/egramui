import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  AnalyticsOverview,
  Comment,
  EngagementStats,
  PageView,
  PopularPost,
  Post,
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

export const authApi = new AuthApi(httpClient);
export const postApi = new PanchayatPostApi(httpClient);
export const commentApi = new PanchayatCommentApi(httpClient);
export const teamApi = new PanchayatTeamApi(httpClient);
export const analyticsAdapter = new AnalyticsAdapter(postApi);
export type AuthUserDTO = ServerUser;


