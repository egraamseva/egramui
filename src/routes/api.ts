import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  Album,
  AnalyticsOverview,
  Announcement,
  Comment,
  EngagementStats,
  GalleryItem,
  LayoutType,
  PageView,
  PanchayatSectionType,
  PanchayatWebsiteConfig,
  PanchayatWebsiteSection,
  PlatformLandingPageConfig,
  PlatformSection,
  PlatformSectionType,
  PopularPost,
  Post,
  Scheme,
  TeamMember,
  UserStatus,
} from "@/types";

const DEFAULT_BASE_URL = "http://localhost:8080/api/v1";
// const DEFAULT_BASE_URL =
//   "https://egrambackend-production.up.railway.app/api/v1";
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

// Global loading state manager
class GlobalLoadingManager {
  private loadingCount = 0;
  private listeners: Set<(loading: boolean) => void> = new Set();

  increment() {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.notify(true);
    }
  }

  decrement() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.notify(false);
    }
  }

  subscribe(callback: (loading: boolean) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(loading: boolean) {
    this.listeners.forEach((callback) => callback(loading));
  }
}

const globalLoadingManager = new GlobalLoadingManager();

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

      // Increment loading count
      globalLoadingManager.increment();

      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        // Decrement loading count on success
        globalLoadingManager.decrement();
        return response;
      },
      (error) => {
        // Decrement loading count on error
        globalLoadingManager.decrement();
        return Promise.reject(error);
      }
    );
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    // Increase timeout for file uploads (multipart/form-data)
    const isFileUpload =
      config.data instanceof FormData ||
      (config.headers &&
        config.headers["Content-Type"] === "multipart/form-data");
    const timeout = isFileUpload ? 120000 : config.timeout || 15000; // 2 minutes for uploads, 15s default

    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout,
    };

    try {
      const response = await this.client.request<ApiResponse<T>>(requestConfig);
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

  postFormData<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ) {
    return this.request<T>({
      method: "POST",
      url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  putFormData<T>(url: string, formData: FormData, config?: AxiosRequestConfig) {
    return this.request<T>({
      method: "PUT",
      url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
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

// Export loading manager for LoadingContext to subscribe
export function getLoadingManager() {
  return globalLoadingManager;
}

/**
 * Auth API
 */
type ServerUser = {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  imageUrl?: string;
  imageKey?: string;
  hasImage?: boolean;
  initials?: string;
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
    const data = await this.http.get<PagedResponse<ServerPost>>(
      "/panchayat/posts",
      {
        params,
      }
    );
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

  async create(payload: {
    title?: string;
    bodyText: string;
    imageFile?: File;
  }) {
    // If there's a file, use FormData
    if (payload.imageFile) {
      const formData = new FormData();
      formData.append("title", payload.title || "");
      formData.append("bodyText", payload.bodyText);
      formData.append("imageFile", payload.imageFile);

      const data = await this.http.postFormData<ServerPost>(
        "/panchayat/posts",
        formData
      );
      return mapPostResponse(data);
    }

    // Otherwise use JSON
    const data = await this.http.post<ServerPost>("/panchayat/posts", {
      title: payload.title,
      bodyText: payload.bodyText,
    });
    return mapPostResponse(data);
  }

  async update(
    id: string | number,
    payload: { title?: string; bodyText: string; mediaUrl?: string }
  ) {
    const data = await this.http.put<ServerPost>(
      `/panchayat/posts/${id}`,
      payload
    );
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
    options?: { approvedOnly?: boolean; pageNumber?: number; pageSize?: number }
  ): Promise<PaginatedResult<Comment>> {
    const data = await this.http.get<PagedResponse<ServerComment>>(
      `/panchayat/posts/${postId}/comments`,
      {
        params: {
          approvedOnly: options?.approvedOnly ?? false,
          page: options?.pageNumber,
          size: options?.pageSize,
        },
      }
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
    return this.http.patch(
      `/panchayat/posts/${postId}/comments/${commentId}/approve`
    );
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

  async list(options?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResult<TeamMember>> {
    const data = await this.http.get<PagedResponse<ServerUser>>(
      "/panchayat/team",
      {
        params: {
          page: options?.page,
          size: options?.size,
        },
      }
    );

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

  async addMember(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    designation?: string;
    imageFile?: File;
    imageUrl?: string;
    compressionQuality?: string;
  }) {
    // Backend always expects multipart/form-data
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("email", payload.email);
    formData.append("phone", payload.phone);
    formData.append("password", payload.password);
    if (payload.designation)
      formData.append("designation", payload.designation);
    if (payload.imageFile instanceof File) {
      formData.append("imageFile", payload.imageFile);
    }
    if (payload.imageUrl) formData.append("imageUrl", payload.imageUrl);
    if (payload.compressionQuality)
      formData.append("compressionQuality", payload.compressionQuality);

    const data = await this.http.postFormData<ServerUser>(
      "/panchayat/team",
      formData
    );
    return mapTeamMemberResponse(data);
  }

  async updateMember(
    userId: string | number,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      password: string;
      designation?: string;
      imageFile?: File;
      imageUrl?: string;
      compressionQuality?: string;
    }>
  ) {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.email !== undefined) formData.append("email", payload.email);
    if (payload.phone !== undefined) formData.append("phone", payload.phone);
    if (payload.password !== undefined)
      formData.append("password", payload.password);
    if (payload.designation !== undefined)
      formData.append("designation", payload.designation || "");
    if (payload.imageFile instanceof File) {
      formData.append("imageFile", payload.imageFile);
    }
    if (payload.imageUrl !== undefined)
      formData.append("imageUrl", payload.imageUrl || "");
    if (payload.compressionQuality)
      formData.append("compressionQuality", payload.compressionQuality);

    const data = await this.http.putFormData<ServerUser>(
      `/panchayat/team/${userId}`,
      formData
    );
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
      averageEngagement: posts.length
        ? (totalLikes + totalComments) / posts.length
        : 0,
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
  phone: user.phone,
  designation: user.designation,
  image: user.imageUrl,
  imageKey: user.imageKey,
  hasImage: user.hasImage ?? false,
  initials:
    user.initials ||
    (user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      : ""),
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
      const data = await this.http.get<PagedResponse<ServerScheme>>(
        "/panchayat/schemes",
        {
          params: { page: 0, size: 100 },
        }
      );
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

  async create(payload: {
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
  }) {
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
    }>
  ) {
    const updatePayload: any = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined)
      updatePayload.description = payload.description;
    if (payload.category !== undefined)
      updatePayload.description = payload.category;
    if (payload.budgetAmount !== undefined)
      updatePayload.budgetAmount = payload.budgetAmount;
    if (payload.beneficiaryCount !== undefined)
      updatePayload.beneficiaryCount = payload.beneficiaryCount;
    if (payload.eligibilityText !== undefined)
      updatePayload.eligibilityText = payload.eligibilityText;
    if (payload.documentUrls !== undefined)
      updatePayload.documentUrls = payload.documentUrls;
    if (payload.contactPersonName !== undefined)
      updatePayload.contactPersonName = payload.contactPersonName;
    if (payload.contactPersonPhone !== undefined)
      updatePayload.contactPersonPhone = payload.contactPersonPhone;
    if (payload.contactPersonEmail !== undefined)
      updatePayload.contactPersonEmail = payload.contactPersonEmail;

    const data = await this.http.put<ServerScheme>(
      `/panchayat/schemes/${id}`,
      updatePayload
    );
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
      const data = await this.http.get<PagedResponse<ServerAnnouncement>>(
        "/panchayat/announcements",
        {
          params: { page: 0, size: 100 },
        }
      );
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
    const data = await this.http.get<ServerAnnouncement>(
      `/panchayat/announcements/${id}`
    );
    return mapAnnouncementResponse(data);
  }

  async create(payload: {
    title: string;
    bodyText: string;
    attachments?: string[];
    startDate?: string;
    endDate?: string;
    priority?: number;
    isActive?: boolean;
  }) {
    const data = await this.http.post<ServerAnnouncement>(
      "/panchayat/announcements",
      payload
    );
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
    }>
  ) {
    const data = await this.http.put<ServerAnnouncement>(
      `/panchayat/announcements/${id}`,
      payload
    );
    return mapAnnouncementResponse(data);
  }

  async delete(id: string | number) {
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
  if (scheme.status === "ACTIVE" || scheme.status === "ONGOING")
    status = "Active";
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

const mapAnnouncementResponse = (
  announcement: ServerAnnouncement
): Announcement => ({
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
      const data = await this.http.get<PagedResponse<ServerAlbum>>(
        "/panchayat/albums",
        {
          params: { page: 0, size: 100 },
        }
      );
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

  async getById(id: string | number): Promise<Album> {
    const data = await this.http.get<ServerAlbum>(`/panchayat/albums/${id}`);
    return mapAlbumResponse(data);
  }

  async create(payload: {
    title: string;
    description?: string;
    coverImage?: string;
  }) {
    const anyPayload: any = payload as any;
    if (anyPayload.coverImageFile instanceof File) {
      const formData = new FormData();
      formData.append("albumName", anyPayload.title || "");
      if (anyPayload.description)
        formData.append("description", anyPayload.description);
      formData.append("coverImageFile", anyPayload.coverImageFile);
      const data = await this.http.post<ServerAlbum>(
        "/panchayat/albums",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return mapAlbumResponse(data);
    }

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
    }>
  ) {
    // If caller passed a File via payload.coverImageFile (not part of type above), send FormData
    const anyPayload: any = payload as any;
    if (anyPayload.coverImageFile instanceof File) {
      const formData = new FormData();
      if (anyPayload.title !== undefined)
        formData.append("albumName", anyPayload.title);
      if (anyPayload.description !== undefined)
        formData.append("description", anyPayload.description);
      formData.append("coverImageFile", anyPayload.coverImageFile);
      const data = await this.http.put<ServerAlbum>(
        `/panchayat/albums/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return mapAlbumResponse(data);
    }

    const updatePayload: any = {};
    if (payload.title !== undefined) updatePayload.albumName = payload.title;
    if (payload.description !== undefined)
      updatePayload.description = payload.description;
    if (payload.coverImage !== undefined)
      updatePayload.coverImageUrl = payload.coverImage;

    const data = await this.http.put<ServerAlbum>(
      `/panchayat/albums/${id}`,
      updatePayload
    );
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

  async list(albumId?: string | number): Promise<PaginatedResult<GalleryItem>> {
    try {
      const params: any = { page: 0, size: 100 };
      if (albumId) params.albumId = albumId;

      const data = await this.http.get<PagedResponse<ServerGalleryImage>>(
        "/panchayat/gallery",
        {
          params,
        }
      );
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

  async getById(id: string | number): Promise<GalleryItem> {
    const data = await this.http.get<ServerGalleryImage>(
      `/panchayat/gallery/${id}`
    );
    return mapGalleryImageResponse(data);
  }

  async create(payload: {
    imageUrl: string;
    caption?: string;
    tags?: string;
    albumId?: number;
    displayOrder?: number;
  }) {
    const anyPayload: any = payload as any;
    // If caller provided an actual File as `imageFile`, send multipart/form-data
    if (anyPayload.imageFile instanceof File) {
      const formData = new FormData();
      if (anyPayload.caption) formData.append("caption", anyPayload.caption);
      if (anyPayload.tags) formData.append("tags", anyPayload.tags);
      if (anyPayload.albumId !== undefined)
        formData.append("albumId", String(anyPayload.albumId));
      if (anyPayload.displayOrder !== undefined)
        formData.append("displayOrder", String(anyPayload.displayOrder));
      formData.append("imageFile", anyPayload.imageFile);
      const data = await this.http.post<ServerGalleryImage>(
        "/panchayat/gallery",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return mapGalleryImageResponse(data);
    }

    const data = await this.http.post<ServerGalleryImage>(
      "/panchayat/gallery",
      payload
    );
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
    }>
  ) {
    const anyPayload: any = payload as any;
    // Backend always expects multipart/form-data, so always use FormData
    const formData = new FormData();
    if (anyPayload.caption !== undefined && anyPayload.caption !== null) {
      formData.append("caption", String(anyPayload.caption));
    }
    if (anyPayload.tags !== undefined && anyPayload.tags !== null) {
      formData.append("tags", String(anyPayload.tags));
    }
    if (anyPayload.albumId !== undefined && anyPayload.albumId !== null) {
      formData.append("albumId", String(anyPayload.albumId));
    }
    if (
      anyPayload.displayOrder !== undefined &&
      anyPayload.displayOrder !== null
    ) {
      formData.append("displayOrder", String(anyPayload.displayOrder));
    }
    if (anyPayload.imageFile instanceof File) {
      formData.append("imageFile", anyPayload.imageFile);
    }
    if (anyPayload.imageUrl !== undefined && anyPayload.imageUrl !== null) {
      formData.append("imageUrl", String(anyPayload.imageUrl));
    }

    const data = await this.http.put<ServerGalleryImage>(
      `/panchayat/gallery/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return mapGalleryImageResponse(data);
  }

  async delete(id: string | number) {
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

const mapGalleryImageResponse = (
  image: ServerGalleryImage
): GalleryItem & { albumId?: number } => ({
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
  officeHours?: string;
  createdAt?: string;
  updatedAt?: string;
  population?: number;
  area?: string;
  wards?: number;
  establishedYear?: number;
  mapCoordinates?: string;
  themeId?: string;
};

class PanchayatSettingsApi {
  constructor(private http: HttpClient) {}

  async get(): Promise<ServerPanchayat> {
    return await this.http.get<ServerPanchayat>("/panchayat/settings");
  }

  async update(payload: Partial<ServerPanchayat>): Promise<ServerPanchayat> {
    return await this.http.put<ServerPanchayat>("/panchayat/settings", payload);
  }

  async uploadLogo(
    imageFile: File,
    compressionQuality: string = "HIGH"
  ): Promise<ServerPanchayat> {
    const formData = new FormData();
    formData.append("imageFile", imageFile);
    formData.append("compressionQuality", compressionQuality);
    return await this.http.post<ServerPanchayat>(
      "/panchayat/settings/logo",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  }

  async uploadHeroImage(
    imageFile: File,
    compressionQuality: string = "HIGH"
  ): Promise<ServerPanchayat> {
    const formData = new FormData();
    formData.append("imageFile", imageFile);
    formData.append("compressionQuality", compressionQuality);
    return await this.http.post<ServerPanchayat>(
      "/panchayat/settings/hero-image",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
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

  async getAll(params?: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ServerAdminPanchayat>> {
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
    return await this.http.get<PagedResponse<ServerAdminPanchayat>>(
      "/admin/panchayats",
      { params: queryParams }
    );
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
    return await this.http.post<ServerAdminPanchayat>(
      "/admin/panchayats",
      payload
    );
  }

  async update(
    id: string | number,
    payload: Partial<{
      panchayatName: string;
      slug: string;
      district: string;
      state: string;
      address?: string;
      contactPhone?: string;
      contactEmail?: string;
      description?: string;
    }>
  ): Promise<ServerAdminPanchayat> {
    return await this.http.put<ServerAdminPanchayat>(
      `/admin/panchayats/${id}`,
      payload
    );
  }

  async updateStatus(id: string | number, status: string): Promise<void> {
    await this.http.patch(`/admin/panchayats/${id}/status`, {
      status: status.toUpperCase(),
    });
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

  async getAll(params?: {
    role?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ServerAdminUser>> {
    const queryParams: any = {};
    if (params?.role) queryParams.role = params.role;
    if (params?.status) queryParams.status = params.status.toUpperCase();
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    return await this.http.get<PagedResponse<ServerAdminUser>>("/admin/users", {
      params: queryParams,
    });
  }

  async updateStatus(id: string | number, status: string): Promise<void> {
    await this.http.patch(`/admin/users/${id}/status`, {
      status: status.toUpperCase(),
    });
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
    return await this.http.get<ServerSystemAnalytics>(
      "/admin/analytics/system"
    );
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

  async getAll(params?: {
    panchayatId?: number;
    actionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ServerAuditLog>> {
    const queryParams: any = {};
    if (params?.panchayatId) queryParams.panchayatId = params.panchayatId;
    if (params?.actionType) queryParams.actionType = params.actionType;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    return await this.http.get<PagedResponse<ServerAuditLog>>(
      "/admin/audit-logs",
      { params: queryParams }
    );
  }
}

/**
 * Newsletter API
 */
type ServerNewsletter = {
  newsletterId: number;
  title: string;
  subtitle?: string;
  coverImageFileKey?: string;
  coverImageUrl?: string;
  content?: string;
  bulletPoints?: string[];
  publishedOn?: string;
  authorName?: string;
  attachments?: string[];
  isPublished: boolean;
  panchayatId?: number;
  panchayatName?: string;
  createdByUserId?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
};

class PanchayatNewsletterApi {
  constructor(private http: HttpClient) {}

  async list(options?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResult<Newsletter>> {
    const data = await this.http.get<PagedResponse<ServerNewsletter>>(
      "/panchayat/newsletters",
      {
        params: {
          page: options?.page ?? 0,
          size: options?.size ?? 20,
        },
      }
    );
    return {
      items: data.content.map(mapNewsletterResponse),
      page: data.page,
      size: data.size,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
      isFirst: data.first,
      isLast: data.last,
    };
  }

  async getById(id: string | number): Promise<Newsletter> {
    const data = await this.http.get<ServerNewsletter>(
      `/panchayat/newsletters/${id}`
    );
    return mapNewsletterResponse(data);
  }

  async create(payload: {
    title: string;
    subtitle?: string;
    content?: string;
    bulletPoints?: string[];
    publishedOn?: string;
    authorName?: string;
    attachments?: string[];
    isPublished?: boolean;
    coverImageFile?: File;
    coverImageFileKey?: string;
  }) {
    const anyPayload: any = payload as any;
    // If caller provided a File, send multipart/form-data
    if (anyPayload.coverImageFile instanceof File) {
      const formData = new FormData();
      formData.append("title", payload.title);
      if (payload.subtitle) formData.append("subtitle", payload.subtitle);
      if (payload.content) formData.append("content", payload.content);
      if (payload.bulletPoints)
        formData.append("bulletPoints", JSON.stringify(payload.bulletPoints));
      if (payload.publishedOn)
        formData.append("publishedOn", payload.publishedOn);
      if (payload.authorName) formData.append("authorName", payload.authorName);
      if (payload.attachments)
        formData.append("attachments", JSON.stringify(payload.attachments));
      if (payload.isPublished !== undefined)
        formData.append("isPublished", String(payload.isPublished));
      formData.append("coverImageFile", anyPayload.coverImageFile);

      const data = await this.http.post<ServerNewsletter>(
        "/panchayat/newsletters",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return mapNewsletterResponse(data);
    }

    // Otherwise use JSON
    const jsonPayload: any = {
      title: payload.title,
      subtitle: payload.subtitle,
      content: payload.content,
      bulletPoints: payload.bulletPoints,
      publishedOn: payload.publishedOn,
      authorName: payload.authorName,
      attachments: payload.attachments,
      isPublished: payload.isPublished,
      coverImageFileKey: payload.coverImageFileKey,
    };
    const data = await this.http.post<ServerNewsletter>(
      "/panchayat/newsletters",
      jsonPayload
    );
    return mapNewsletterResponse(data);
  }

  async update(
    id: string | number,
    payload: Partial<{
      title: string;
      subtitle?: string;
      content?: string;
      bulletPoints?: string[];
      publishedOn?: string;
      authorName?: string;
      attachments?: string[];
      isPublished?: boolean;
      coverImageFile?: File;
      coverImageFileKey?: string;
    }>
  ) {
    const anyPayload: any = payload as any;
    if (anyPayload.coverImageFile instanceof File) {
      const formData = new FormData();
      if (anyPayload.title !== undefined)
        formData.append("title", anyPayload.title);
      if (anyPayload.subtitle !== undefined)
        formData.append("subtitle", anyPayload.subtitle);
      if (anyPayload.content !== undefined)
        formData.append("content", anyPayload.content);
      if (anyPayload.bulletPoints !== undefined)
        formData.append(
          "bulletPoints",
          JSON.stringify(anyPayload.bulletPoints)
        );
      if (anyPayload.publishedOn !== undefined)
        formData.append("publishedOn", anyPayload.publishedOn);
      if (anyPayload.authorName !== undefined)
        formData.append("authorName", anyPayload.authorName);
      if (anyPayload.attachments !== undefined)
        formData.append("attachments", JSON.stringify(anyPayload.attachments));
      if (anyPayload.isPublished !== undefined)
        formData.append("isPublished", String(anyPayload.isPublished));
      formData.append("coverImageFile", anyPayload.coverImageFile);

      const data = await this.http.put<ServerNewsletter>(
        `/panchayat/newsletters/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return mapNewsletterResponse(data);
    }

    const updatePayload: any = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.subtitle !== undefined)
      updatePayload.subtitle = payload.subtitle;
    if (payload.content !== undefined) updatePayload.content = payload.content;
    if (payload.bulletPoints !== undefined)
      updatePayload.bulletPoints = payload.bulletPoints;
    if (payload.publishedOn !== undefined)
      updatePayload.publishedOn = payload.publishedOn;
    if (payload.authorName !== undefined)
      updatePayload.authorName = payload.authorName;
    if (payload.attachments !== undefined)
      updatePayload.attachments = payload.attachments;
    if (payload.isPublished !== undefined)
      updatePayload.isPublished = payload.isPublished;
    if (payload.coverImageFileKey !== undefined)
      updatePayload.coverImageFileKey = payload.coverImageFileKey;

    const data = await this.http.put<ServerNewsletter>(
      `/panchayat/newsletters/${id}`,
      updatePayload
    );
    return mapNewsletterResponse(data);
  }

  async togglePublish(id: string | number) {
    return this.http.patch(`/panchayat/newsletters/${id}/publish`);
  }

  async delete(id: string | number) {
    return this.http.delete(`/panchayat/newsletters/${id}`);
  }
}

/**
 * Public Newsletter API
 */
class PublicNewsletterApi {
  constructor(private http: HttpClient) {}

  async list(
    slug: string,
    options?: { search?: string; page?: number; size?: number }
  ): Promise<PaginatedResult<Newsletter>> {
    const params: any = {
      page: options?.page ?? 0,
      size: options?.size ?? 20,
    };
    if (options?.search) params.search = options.search;

    const data = await this.http.get<PagedResponse<ServerNewsletter>>(
      `/public/${slug}/newsletters`,
      {
        params,
      }
    );
    return {
      items: data.content.map(mapNewsletterResponse),
      page: data.page,
      size: data.size,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
      isFirst: data.first,
      isLast: data.last,
    };
  }

  async getById(slug: string, id: string | number): Promise<Newsletter> {
    const data = await this.http.get<ServerNewsletter>(
      `/public/${slug}/newsletters/${id}`
    );
    return mapNewsletterResponse(data);
  }
}

// Newsletter type (add to types if not exists)
type Newsletter = {
  id: string;
  title: string;
  subtitle?: string;
  coverImageFileKey?: string;
  coverImageUrl?: string;
  content?: string;
  bulletPoints?: string[];
  publishedOn?: string;
  authorName?: string;
  attachments?: string[];
  isPublished: boolean;
  panchayatId?: string;
  panchayatName?: string;
  createdAt?: string;
  updatedAt?: string;
};

const mapNewsletterResponse = (newsletter: ServerNewsletter): Newsletter => ({
  id: String(newsletter.newsletterId),
  title: newsletter.title,
  subtitle: newsletter.subtitle,
  coverImageFileKey: newsletter.coverImageFileKey,
  coverImageUrl: newsletter.coverImageUrl,
  content: newsletter.content,
  bulletPoints: newsletter.bulletPoints || [],
  publishedOn: newsletter.publishedOn,
  authorName: newsletter.authorName,
  attachments: newsletter.attachments || [],
  isPublished: newsletter.isPublished,
  panchayatId: newsletter.panchayatId
    ? String(newsletter.panchayatId)
    : undefined,
  panchayatName: newsletter.panchayatName,
  createdAt: newsletter.createdAt || new Date().toISOString(),
  updatedAt: newsletter.updatedAt || new Date().toISOString(),
});

export const authApi = new AuthApi(httpClient);
export const postApi = new PanchayatPostApi(httpClient);
export const commentApi = new PanchayatCommentApi(httpClient);
export const teamApi = new PanchayatTeamApi(httpClient);
export const schemeApi = new PanchayatSchemeApi(httpClient);
export const announcementApi = new PanchayatAnnouncementApi(httpClient);
export const albumApi = new PanchayatAlbumApi(httpClient);
export const galleryApi = new PanchayatGalleryApi(httpClient);
export const settingsApi = new PanchayatSettingsApi(httpClient);
export const newsletterApi = new PanchayatNewsletterApi(httpClient);
export const publicNewsletterApi = new PublicNewsletterApi(httpClient);
export const analyticsAdapter = new AnalyticsAdapter(postApi);
export const adminPanchayatApi = new AdminPanchayatApi(httpClient);
export const adminUserApi = new AdminUserApi(httpClient);
export const adminAnalyticsApi = new AdminAnalyticsApi(httpClient);
export const adminAuditLogApi = new AdminAuditLogApi(httpClient);

/**
 * Platform Landing Page API
 */
class PlatformLandingPageApi {
  constructor(private http: HttpClient) {}

  async getSections(): Promise<PlatformSection[]> {
    const data = await this.http.get<{ sections: any[] }>(
      "/admin/platform/landing-page"
    );
    return data.sections.map(this.mapSection);
  }

  async createSection(payload: {
    sectionType: PlatformSectionType;
    title?: string;
    subtitle?: string;
    content?: any;
    layoutType: LayoutType;
    displayOrder?: number;
    isVisible?: boolean;
    backgroundColor?: string;
    textColor?: string;
    imageUrl?: string;
    imageKey?: string;
    metadata?: Record<string, any>;
    imageFile?: File;
    compressionQuality?: string;
    contentItemImages?: File[];
  }): Promise<PlatformSection> {
    const anyPayload: any = payload as any;
    const hasImageFile = anyPayload.imageFile instanceof File;
    const hasContentItemImages = anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages) && anyPayload.contentItemImages.length > 0;
    
    console.log('Platform createSection API call:', {
      hasImageFile,
      hasContentItemImages,
      contentItemImagesLength: anyPayload.contentItemImages?.length || 0
    });
    
    // Use multipart if imageFile or contentItemImages are present
    if (hasImageFile || hasContentItemImages) {
      console.log('✅ Using multipart form data for platform:', { hasImageFile, hasContentItemImages, contentItemImagesCount: hasContentItemImages ? anyPayload.contentItemImages.length : 0 });
      const formData = new FormData();
      formData.append("sectionType", payload.sectionType);
      if (payload.title) formData.append("title", payload.title);
      if (payload.subtitle) formData.append("subtitle", payload.subtitle);
      if (payload.content)
        formData.append(
          "content",
          typeof payload.content === "string"
            ? payload.content
            : JSON.stringify(payload.content)
        );
      formData.append("layoutType", payload.layoutType);
      if (payload.displayOrder !== undefined)
        formData.append("displayOrder", String(payload.displayOrder));
      if (payload.isVisible !== undefined)
        formData.append("isVisible", String(payload.isVisible));
      if (payload.backgroundColor)
        formData.append("backgroundColor", payload.backgroundColor);
      if (payload.textColor) formData.append("textColor", payload.textColor);
      if (payload.imageUrl) formData.append("imageUrl", payload.imageUrl);
      if (payload.imageKey) formData.append("imageKey", payload.imageKey);
      if (payload.metadata)
        formData.append("metadata", JSON.stringify(payload.metadata));
      if (anyPayload.imageFile instanceof File) {
        formData.append("imageFile", anyPayload.imageFile);
      }
      if (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages)) {
        console.log(`Appending ${anyPayload.contentItemImages.length} contentItemImages to FormData for platform create`);
        anyPayload.contentItemImages.forEach((file: File, index: number) => {
          console.log(`  - Appending contentItemImages[${index}]: ${file.name} (${file.size} bytes)`);
          formData.append("contentItemImages", file);
        });
      }
      formData.append(
        "compressionQuality",
        payload.compressionQuality || "HIGH"
      );

      console.log('Sending multipart FormData to POST /admin/platform/landing-page/sections');
      const data = await this.http.post<any>(
        "/admin/platform/landing-page/sections",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return this.mapSection(data);
    }

    const jsonPayload: any = {
      sectionType: payload.sectionType,
      title: payload.title,
      subtitle: payload.subtitle,
      content:
        typeof payload.content === "string"
          ? payload.content
          : JSON.stringify(payload.content),
      layoutType: payload.layoutType,
      displayOrder: payload.displayOrder,
      isVisible: payload.isVisible,
      backgroundColor: payload.backgroundColor,
      textColor: payload.textColor,
      imageUrl: payload.imageUrl,
      imageKey: payload.imageKey,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
    };
    const data = await this.http.post<any>(
      "/admin/platform/landing-page/sections",
      jsonPayload
    );
    return this.mapSection(data);
  }

  async updateSection(
    id: string | number,
    payload: Partial<{
      sectionType: PlatformSectionType;
      title?: string;
      subtitle?: string;
      content?: any;
      layoutType: LayoutType;
      displayOrder?: number;
      isVisible?: boolean;
      backgroundColor?: string;
      textColor?: string;
      imageUrl?: string;
      imageKey?: string;
      metadata?: Record<string, any>;
      imageFile?: File;
      compressionQuality?: string;
      contentItemImages?: File[];
    }>
  ): Promise<PlatformSection> {
    const anyPayload: any = payload as any;
    // Use multipart if imageFile or contentItemImages are present
    if (anyPayload.imageFile instanceof File || (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages) && anyPayload.contentItemImages.length > 0)) {
      const formData = new FormData();
      if (anyPayload.sectionType !== undefined)
        formData.append("sectionType", anyPayload.sectionType);
      if (anyPayload.title !== undefined)
        formData.append("title", anyPayload.title);
      if (anyPayload.subtitle !== undefined)
        formData.append("subtitle", anyPayload.subtitle);
      if (anyPayload.content !== undefined)
        formData.append(
          "content",
          typeof anyPayload.content === "string"
            ? anyPayload.content
            : JSON.stringify(anyPayload.content)
        );
      if (anyPayload.layoutType !== undefined)
        formData.append("layoutType", anyPayload.layoutType);
      if (anyPayload.displayOrder !== undefined)
        formData.append("displayOrder", String(anyPayload.displayOrder));
      if (anyPayload.isVisible !== undefined)
        formData.append("isVisible", String(anyPayload.isVisible));
      if (anyPayload.backgroundColor !== undefined)
        formData.append("backgroundColor", anyPayload.backgroundColor);
      if (anyPayload.textColor !== undefined)
        formData.append("textColor", anyPayload.textColor);
      if (anyPayload.imageUrl !== undefined)
        formData.append("imageUrl", anyPayload.imageUrl);
      if (anyPayload.imageKey !== undefined)
        formData.append("imageKey", anyPayload.imageKey);
      if (anyPayload.metadata !== undefined)
        formData.append("metadata", JSON.stringify(anyPayload.metadata));
      if (anyPayload.imageFile instanceof File) {
        formData.append("imageFile", anyPayload.imageFile);
      }
      if (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages)) {
        console.log(`Appending ${anyPayload.contentItemImages.length} contentItemImages to FormData for platform update`);
        anyPayload.contentItemImages.forEach((file: File, index: number) => {
          console.log(`  - Appending contentItemImages[${index}]: ${file.name} (${file.size} bytes)`);
          formData.append("contentItemImages", file);
        });
      }
      // Add compressionQuality if not already set
      if (anyPayload.compressionQuality !== undefined) {
        formData.append("compressionQuality", anyPayload.compressionQuality);
      } else {
        formData.append("compressionQuality", "HIGH"); // Default
      }

      console.log('Sending multipart FormData to PUT /admin/platform/landing-page/sections/' + id);
      const data = await this.http.put<any>(
        `/admin/platform/landing-page/sections/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return this.mapSection(data);
    }

    const updatePayload: any = {};
    if (payload.sectionType !== undefined)
      updatePayload.sectionType = payload.sectionType;
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.subtitle !== undefined)
      updatePayload.subtitle = payload.subtitle;
    if (payload.content !== undefined)
      updatePayload.content =
        typeof payload.content === "string"
          ? payload.content
          : JSON.stringify(payload.content);
    if (payload.layoutType !== undefined)
      updatePayload.layoutType = payload.layoutType;
    if (payload.displayOrder !== undefined)
      updatePayload.displayOrder = payload.displayOrder;
    if (payload.isVisible !== undefined)
      updatePayload.isVisible = payload.isVisible;
    if (payload.backgroundColor !== undefined)
      updatePayload.backgroundColor = payload.backgroundColor;
    if (payload.textColor !== undefined)
      updatePayload.textColor = payload.textColor;
    if (payload.imageUrl !== undefined)
      updatePayload.imageUrl = payload.imageUrl;
    if (payload.imageKey !== undefined)
      updatePayload.imageKey = payload.imageKey;
    if (payload.metadata !== undefined)
      updatePayload.metadata = JSON.stringify(payload.metadata);

    const data = await this.http.put<any>(
      `/admin/platform/landing-page/sections/${id}`,
      updatePayload
    );
    return this.mapSection(data);
  }

  async deleteSection(id: string | number): Promise<void> {
    await this.http.delete(`/admin/platform/landing-page/sections/${id}`);
  }

  async updateOrder(id: string | number, newOrder: number): Promise<void> {
    await this.http.patch(`/admin/platform/landing-page/sections/${id}/order`, {
      displayOrder: newOrder,
    });
  }

  async toggleVisibility(
    id: string | number,
    currentVisibility?: boolean
  ): Promise<void> {
    // If currentVisibility is provided, use it; otherwise fetch all sections to find the current state
    let isVisible = currentVisibility;
    if (isVisible === undefined) {
      const sections = await this.getSections();
      const section = sections.find((s) => s.id === String(id));
      if (!section) {
        throw new Error("Section not found");
      }
      isVisible = section.isVisible;
    }
    await this.http.patch(
      `/admin/platform/landing-page/sections/${id}/visibility`,
      { isVisible: !isVisible }
    );
  }

  async uploadImage(
    id: string | number,
    file: File,
    compressionQuality: string = "HIGH"
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("compressionQuality", compressionQuality);
    const data = await this.http.post<any>(
      `/admin/platform/landing-page/sections/${id}/upload-image`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    // Extract imageUrl from response - data is PlatformSectionResponseDTO after unwrapping
    const imageUrl = data?.imageUrl || data?.data?.imageUrl || null;
    if (!imageUrl) {
      console.error('Failed to extract imageUrl from upload response:', data);
      throw new Error('Image upload succeeded but no imageUrl returned');
    }
    return { imageUrl };
  }

  async uploadImageGeneric(
    file: File,
    compressionQuality: string = "HIGH"
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("compressionQuality", compressionQuality);
    const data = await this.http.post<any>(
      `/admin/platform/landing-page/upload-image`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    // Extract imageUrl from response - data is ApiResponse<ImageUploadResponse>
    const imageUrl = data?.data?.imageUrl || data?.imageUrl || null;
    if (!imageUrl) {
      console.error('Failed to extract imageUrl from upload response:', data);
      throw new Error('Image upload succeeded but no imageUrl returned');
    }
    return { imageUrl };
  }

  private mapSection(section: any): PlatformSection {
    // Parse content - handle both string and object
    let parsedContent: any = {};
    if (typeof section.content === "string") {
      if (section.content && section.content.trim()) {
        try {
          parsedContent = JSON.parse(section.content);
        } catch (e) {
          console.warn('Failed to parse section content as JSON:', e, 'Content:', section.content.substring(0, 100));
          parsedContent = {};
        }
      }
    } else if (section.content && typeof section.content === 'object') {
      parsedContent = section.content;
    }
    
    // Debug logging for IMAGE_WITH_TEXT
    if (section.sectionType === 'IMAGE_WITH_TEXT') {
      console.log('Platform mapSection - IMAGE_WITH_TEXT:', {
        sectionId: section.id,
        rawContentType: typeof section.content,
        parsedContentType: typeof parsedContent,
        parsedContentImage: parsedContent?.image,
        sectionImageUrl: section.imageUrl,
        contentKeys: parsedContent && typeof parsedContent === 'object' ? Object.keys(parsedContent) : []
      });
    }
    
    return {
      id: String(section.id),
      sectionType: section.sectionType,
      title: section.title,
      subtitle: section.subtitle,
      content: parsedContent,
      layoutType: section.layoutType,
      displayOrder: section.displayOrder,
      isVisible: section.isVisible,
      backgroundColor: section.backgroundColor,
      textColor: section.textColor,
      imageUrl: section.imageUrl,
      imageKey: section.imageKey,
      metadata:
        typeof section.metadata === "string"
          ? section.metadata
            ? JSON.parse(section.metadata)
            : {}
          : section.metadata,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}

/**
 * Panchayat Website API
 */
class PanchayatWebsiteApi {
  constructor(private http: HttpClient) {}

  async getSections(): Promise<PanchayatWebsiteSection[]> {
    const data = await this.http.get<{ sections: any[] }>(
      "/panchayat/website/sections"
    );
    return data.sections.map(this.mapSection);
  }

  async createSection(payload: {
    sectionType: PanchayatSectionType;
    title?: string;
    subtitle?: string;
    content?: any;
    layoutType: LayoutType;
    displayOrder?: number;
    isVisible?: boolean;
    backgroundColor?: string;
    textColor?: string;
    imageUrl?: string;
    imageKey?: string;
    metadata?: Record<string, any>;
    imageFile?: File;
    compressionQuality?: string;
    contentItemImages?: File[];
  }): Promise<PanchayatWebsiteSection> {
    const anyPayload: any = payload as any;
    const hasImageFile = anyPayload.imageFile instanceof File;
    const hasContentItemImages = anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages) && anyPayload.contentItemImages.length > 0;
    
    console.log('createSection API call:', {
      hasImageFile,
      hasContentItemImages,
      contentItemImages: anyPayload.contentItemImages,
      contentItemImagesType: typeof anyPayload.contentItemImages,
      contentItemImagesIsArray: Array.isArray(anyPayload.contentItemImages),
      contentItemImagesLength: anyPayload.contentItemImages?.length || 0
    });
    
    // Use multipart if imageFile or contentItemImages are present
    if (hasImageFile || hasContentItemImages) {
      console.log('✅ Using multipart form data:', { hasImageFile, hasContentItemImages, contentItemImagesCount: hasContentItemImages ? anyPayload.contentItemImages.length : 0 });
      const formData = new FormData();
      formData.append("sectionType", payload.sectionType);
      if (payload.title) formData.append("title", payload.title);
      if (payload.subtitle) formData.append("subtitle", payload.subtitle);
      if (payload.content)
        formData.append(
          "content",
          typeof payload.content === "string"
            ? payload.content
            : JSON.stringify(payload.content)
        );
      formData.append("layoutType", payload.layoutType);
      if (payload.displayOrder !== undefined)
        formData.append("displayOrder", String(payload.displayOrder));
      if (payload.isVisible !== undefined)
        formData.append("isVisible", String(payload.isVisible));
      if (payload.backgroundColor)
        formData.append("backgroundColor", payload.backgroundColor);
      if (payload.textColor) formData.append("textColor", payload.textColor);
      if (payload.imageUrl) formData.append("imageUrl", payload.imageUrl);
      if (payload.imageKey) formData.append("imageKey", payload.imageKey);
      if (payload.metadata)
        formData.append("metadata", JSON.stringify(payload.metadata));
      if (anyPayload.imageFile instanceof File) {
        formData.append("imageFile", anyPayload.imageFile);
      }
      if (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages)) {
        console.log(`Appending ${anyPayload.contentItemImages.length} contentItemImages to FormData`);
        anyPayload.contentItemImages.forEach((file: File, index: number) => {
          console.log(`  - Appending contentItemImages[${index}]: ${file.name} (${file.size} bytes)`);
          formData.append("contentItemImages", file);
        });
      } else {
        console.log('No contentItemImages to append to FormData');
      }
      formData.append(
        "compressionQuality",
        payload.compressionQuality || "HIGH"
      );

      console.log('Sending multipart FormData to /panchayat/website/sections');
      const data = await this.http.post<any>(
        "/panchayat/website/sections",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return this.mapSection(data);
    }

    console.log('⚠️ Using JSON payload (no imageFile or contentItemImages)');
    const jsonPayload: any = {
      sectionType: payload.sectionType,
      title: payload.title,
      subtitle: payload.subtitle,
      content:
        typeof payload.content === "string"
          ? payload.content
          : JSON.stringify(payload.content),
      layoutType: payload.layoutType,
      displayOrder: payload.displayOrder,
      isVisible: payload.isVisible,
      backgroundColor: payload.backgroundColor,
      textColor: payload.textColor,
      imageUrl: payload.imageUrl,
      imageKey: payload.imageKey,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
    };
    const data = await this.http.post<any>(
      "/panchayat/website/sections",
      jsonPayload
    );
    return this.mapSection(data);
  }

  async updateSection(
    id: string | number,
    payload: Partial<{
      sectionType: PanchayatSectionType;
      title?: string;
      subtitle?: string;
      content?: any;
      layoutType: LayoutType;
      displayOrder?: number;
      isVisible?: boolean;
      backgroundColor?: string;
      textColor?: string;
      imageUrl?: string;
      imageKey?: string;
      metadata?: Record<string, any>;
      imageFile?: File;
      contentItemImages?: File[];
    }>
  ): Promise<PanchayatWebsiteSection> {
    const anyPayload: any = payload as any;
    // Use multipart if imageFile or contentItemImages are present
    if (anyPayload.imageFile instanceof File || (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages) && anyPayload.contentItemImages.length > 0)) {
      const formData = new FormData();
      if (anyPayload.sectionType !== undefined)
        formData.append("sectionType", anyPayload.sectionType);
      if (anyPayload.title !== undefined)
        formData.append("title", anyPayload.title);
      if (anyPayload.subtitle !== undefined)
        formData.append("subtitle", anyPayload.subtitle);
      if (anyPayload.content !== undefined)
        formData.append(
          "content",
          typeof anyPayload.content === "string"
            ? anyPayload.content
            : JSON.stringify(anyPayload.content)
        );
      if (anyPayload.layoutType !== undefined)
        formData.append("layoutType", anyPayload.layoutType);
      if (anyPayload.displayOrder !== undefined)
        formData.append("displayOrder", String(anyPayload.displayOrder));
      if (anyPayload.isVisible !== undefined)
        formData.append("isVisible", String(anyPayload.isVisible));
      if (anyPayload.backgroundColor !== undefined)
        formData.append("backgroundColor", anyPayload.backgroundColor);
      if (anyPayload.textColor !== undefined)
        formData.append("textColor", anyPayload.textColor);
      if (anyPayload.imageUrl !== undefined)
        formData.append("imageUrl", anyPayload.imageUrl);
      if (anyPayload.imageKey !== undefined)
        formData.append("imageKey", anyPayload.imageKey);
      if (anyPayload.metadata !== undefined)
        formData.append("metadata", JSON.stringify(anyPayload.metadata));
      if (anyPayload.imageFile instanceof File) {
        formData.append("imageFile", anyPayload.imageFile);
      }
      if (anyPayload.contentItemImages && Array.isArray(anyPayload.contentItemImages)) {
        console.log(`Appending ${anyPayload.contentItemImages.length} contentItemImages to FormData for update`);
        anyPayload.contentItemImages.forEach((file: File, index: number) => {
          console.log(`  - Appending contentItemImages[${index}]: ${file.name} (${file.size} bytes)`);
          formData.append("contentItemImages", file);
        });
      }
      // Add compressionQuality if not already set
      if (anyPayload.compressionQuality !== undefined) {
        formData.append("compressionQuality", anyPayload.compressionQuality);
      } else {
        formData.append("compressionQuality", "HIGH"); // Default
      }

      console.log('Sending multipart FormData to PUT /panchayat/website/sections/' + id);
      const data = await this.http.put<any>(
        `/panchayat/website/sections/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return this.mapSection(data);
    }

    const updatePayload: any = {};
    if (payload.sectionType !== undefined)
      updatePayload.sectionType = payload.sectionType;
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.subtitle !== undefined)
      updatePayload.subtitle = payload.subtitle;
    if (payload.content !== undefined)
      updatePayload.content =
        typeof payload.content === "string"
          ? payload.content
          : JSON.stringify(payload.content);
    if (payload.layoutType !== undefined)
      updatePayload.layoutType = payload.layoutType;
    if (payload.displayOrder !== undefined)
      updatePayload.displayOrder = payload.displayOrder;
    if (payload.isVisible !== undefined)
      updatePayload.isVisible = payload.isVisible;
    if (payload.backgroundColor !== undefined)
      updatePayload.backgroundColor = payload.backgroundColor;
    if (payload.textColor !== undefined)
      updatePayload.textColor = payload.textColor;
    if (payload.imageUrl !== undefined)
      updatePayload.imageUrl = payload.imageUrl;
    if (payload.imageKey !== undefined)
      updatePayload.imageKey = payload.imageKey;
    if (payload.metadata !== undefined)
      updatePayload.metadata = JSON.stringify(payload.metadata);

    const data = await this.http.put<any>(
      `/panchayat/website/sections/${id}`,
      updatePayload
    );
    return this.mapSection(data);
  }

  async deleteSection(id: string | number): Promise<void> {
    await this.http.delete(`/panchayat/website/sections/${id}`);
  }

  async updateOrder(id: string | number, newOrder: number): Promise<void> {
    await this.http.patch(`/panchayat/website/sections/${id}/order`, {
      displayOrder: newOrder,
    });
  }

  async toggleVisibility(
    id: string | number,
    currentVisibility?: boolean
  ): Promise<void> {
    // If currentVisibility is provided, use it; otherwise fetch all sections to find the current state
    let isVisible = currentVisibility;
    if (isVisible === undefined) {
      const sections = await this.getSections();
      const section = sections.find((s) => s.id === String(id));
      if (!section) {
        throw new Error("Section not found");
      }
      isVisible = section.isVisible;
    }
    await this.http.patch(`/panchayat/website/sections/${id}/visibility`, {
      isVisible: !isVisible,
    });
  }

  async uploadImage(
    id: string | number,
    file: File,
    compressionQuality: string = "HIGH"
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("compressionQuality", compressionQuality);
    const data = await this.http.post<any>(
      `/panchayat/website/sections/${id}/upload-image`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    // Extract imageUrl from response - data is PanchayatWebsiteSectionResponseDTO after unwrapping
    const imageUrl = data?.imageUrl || data?.data?.imageUrl || null;
    if (!imageUrl) {
      console.error('Failed to extract imageUrl from upload response:', data);
      throw new Error('Image upload succeeded but no imageUrl returned');
    }
    return { imageUrl };
  }

  async uploadImageGeneric(
    file: File,
    compressionQuality: string = "HIGH"
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("imageFile", file);
    formData.append("compressionQuality", compressionQuality);
    const data = await this.http.post<any>(
      `/panchayat/website/upload-image`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    // Extract imageUrl from response - data is ApiResponse<ImageUploadResponse>
    const imageUrl = data?.data?.imageUrl || data?.imageUrl || null;
    if (!imageUrl) {
      console.error('Failed to extract imageUrl from upload response:', data);
      throw new Error('Image upload succeeded but no imageUrl returned');
    }
    return { imageUrl };
  }

  private mapSection(section: any): PanchayatWebsiteSection {
    // Parse content - handle both string and object
    let parsedContent: any = {};
    if (typeof section.content === "string") {
      if (section.content && section.content.trim()) {
        try {
          parsedContent = JSON.parse(section.content);
        } catch (e) {
          console.warn('Failed to parse panchayat section content as JSON:', e, 'Content:', section.content.substring(0, 100));
          parsedContent = {};
        }
      }
    } else if (section.content && typeof section.content === 'object') {
      parsedContent = section.content;
    }
    
    // Debug logging for IMAGE_WITH_TEXT
    if (section.sectionType === 'IMAGE_WITH_TEXT') {
      console.log('Panchayat mapSection - IMAGE_WITH_TEXT:', {
        sectionId: section.id,
        rawContentType: typeof section.content,
        parsedContentType: typeof parsedContent,
        parsedContentImage: parsedContent?.image,
        sectionImageUrl: section.imageUrl,
        contentKeys: parsedContent && typeof parsedContent === 'object' ? Object.keys(parsedContent) : []
      });
    }
    
    return {
      id: String(section.id),
      panchayatId: String(section.panchayatId),
      sectionType: section.sectionType,
      title: section.title,
      subtitle: section.subtitle,
      content: parsedContent,
      layoutType: section.layoutType,
      displayOrder: section.displayOrder,
      isVisible: section.isVisible,
      backgroundColor: section.backgroundColor,
      textColor: section.textColor,
      imageUrl: section.imageUrl,
      imageKey: section.imageKey,
      metadata:
        typeof section.metadata === "string"
          ? section.metadata
            ? JSON.parse(section.metadata)
            : {}
          : section.metadata,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}

/**
 * Public Platform Landing Page API
 */
class PublicPlatformLandingPageApi {
  constructor(private http: HttpClient) {}

  async getSections(): Promise<PlatformSection[]> {
    const data = await this.http.get<{ sections: any[] }>(
      "/public/platform/landing-page"
    );
    return data.sections.map((section: any) => ({
      id: String(section.id),
      sectionType: section.sectionType,
      title: section.title,
      subtitle: section.subtitle,
      content:
        typeof section.content === "string"
          ? section.content
            ? JSON.parse(section.content)
            : {}
          : section.content,
      layoutType: section.layoutType,
      displayOrder: section.displayOrder,
      isVisible: section.isVisible,
      backgroundColor: section.backgroundColor,
      textColor: section.textColor,
      imageUrl: section.imageUrl,
      imageKey: section.imageKey,
      metadata:
        typeof section.metadata === "string"
          ? section.metadata
            ? JSON.parse(section.metadata)
            : {}
          : section.metadata,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    }));
  }
}

/**
 * Public Panchayat Website API
 */
class PublicPanchayatWebsiteApi {
  constructor(private http: HttpClient) {}

  async getSections(slug: string): Promise<PanchayatWebsiteSection[]> {
    const data = await this.http.get<{ sections: any[] }>(
      `/public/${slug}/website`
    );
    return data.sections.map((section: any) => ({
      id: String(section.id),
      panchayatId: String(section.panchayatId),
      sectionType: section.sectionType,
      title: section.title,
      subtitle: section.subtitle,
      content:
        typeof section.content === "string"
          ? section.content
            ? JSON.parse(section.content)
            : {}
          : section.content,
      layoutType: section.layoutType,
      displayOrder: section.displayOrder,
      isVisible: section.isVisible,
      backgroundColor: section.backgroundColor,
      textColor: section.textColor,
      imageUrl: section.imageUrl,
      imageKey: section.imageKey,
      metadata:
        typeof section.metadata === "string"
          ? section.metadata
            ? JSON.parse(section.metadata)
            : {}
          : section.metadata,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    }));
  }
}

export const platformLandingPageApi = new PlatformLandingPageApi(httpClient);
export const panchayatWebsiteApi = new PanchayatWebsiteApi(httpClient);
export const publicPlatformLandingPageApi = new PublicPlatformLandingPageApi(
  httpClient
);
export const publicPanchayatWebsiteApi = new PublicPanchayatWebsiteApi(
  httpClient
);

export type AuthUserDTO = ServerUser;
