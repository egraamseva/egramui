/**
 * API Service Layer
 * Handles all API calls using axios with mock data
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Post,
  Scheme,
  PanchayatMember,
  Announcement,
  GalleryItem,
  RegistrationFormData,
  ActivePanchayat,
  Project,
  PanchayatDetails,
  AdminUser,
  TeamMember,
  Document,
  Comment,
  Album,
  PanchayatSettings,
  AnalyticsOverview,
  PageView,
  PopularPost,
  EngagementStats,
  SuperAdminPanchayat,
  AuditLog,
  UserStatus,
  PanchayatStatus,
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
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
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Mock data storage (simulating backend)
const mockData = {
  users: [
    {
      id: '1',
      email: 'sachiv@ramnagar.egramseva.gov.in',
      password: 'password123',
      name: 'Rajesh Sharma',
      role: 'Panchayat Sachiv',
      panchayatId: 'panchayat-1',
      panchayatName: 'Ramnagar',
    },
    {
      id: '2',
      email: 'admin@gmail.com',
      password: 'password123',
      name: 'Rajesh Sharma',
      role: 'super_admin',
      panchayatId: 'panchayat-1',
      panchayatName: 'Ramnagar',
    },
  ],
  panchayats: [
    {
      id: 'panchayat-1',
      name: 'Ramnagar',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      block: 'Varanasi Block',
      population: 5200,
      area: '12.5',
      wards: 8,
      subdomain: 'ramnagar',
      established: 1995,
      description: 'Ramnagar Gram Panchayat is a vibrant rural community located in Varanasi district. Established in 1995, our village has a rich history and cultural heritage spanning several centuries. With a population of over 5,200 residents spread across 8 wards, we are committed to sustainable development, preserving our traditions while embracing modern governance practices.',
      heroImage: 'https://images.unsplash.com/photo-1736914319111-d54ada582633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB2aWxsYWdlJTIwcGFuY2hheWF0fGVufDF8fHx8MTc2Mjc1MjM1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      contactInfo: {
        address: 'Ramnagar Gram Panchayat Bhawan, Varanasi, Uttar Pradesh - 221001',
        phone: '+91 542-XXXXXX',
        email: 'ramnagar@egramseva.gov.in',
        officeHours: 'Monday - Friday: 10:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM',
      },
      features: [
        '3 Primary Schools and 1 High School',
        'Primary Health Center with 24/7 services',
        'Community Hall and Sports Ground',
        'Panchayat Bhawan with modern facilities',
        'Agricultural Service Center',
      ],
    },
  ],
  posts: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      author: 'Rajesh Sharma',
      authorRole: 'Panchayat Sachiv',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      content: 'Great news! Our village has been selected for the PM Awas Yojana Phase 2. 45 families will receive housing assistance. Construction will begin next month. 🏠',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1759738098462-90ffac98c554?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYWdlJTIwZGV2ZWxvcG1lbnQlMjBpbmRpYXxlbnwxfHx8fDE3NjI3NTIzNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      likes: 156,
      comments: 23,
      shares: 8,
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      author: 'Rajesh Sharma',
      authorRole: 'Panchayat Sachiv',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      content: 'Successful completion of our community water supply project! Every household now has access to clean drinking water 24/7.',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1707721690544-781fe6ede937?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBhZ3JpY3VsdHVyZSUyMGZpZWxkfGVufDF8fHx8MTc2Mjc1MjM1OHww&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      likes: 234,
      comments: 45,
      shares: 12,
    },
  ],
  schemes: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      name: 'PM Awas Yojana',
      category: 'Housing',
      budget: '₹50,00,000',
      beneficiaries: 45,
      progress: 75,
      status: 'Active' as const,
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      name: 'Swachh Bharat Mission',
      category: 'Sanitation',
      budget: '₹15,00,000',
      beneficiaries: 120,
      progress: 90,
      status: 'Active' as const,
    },
    {
      id: '3',
      panchayatId: 'panchayat-1',
      name: 'MGNREGA',
      category: 'Employment',
      budget: '₹80,00,000',
      beneficiaries: 250,
      progress: 60,
      status: 'Active' as const,
    },
  ],
  announcements: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      title: 'Village Development Meeting',
      date: '2025-11-15',
      description: 'Important meeting to discuss upcoming development projects. All residents are invited.',
      status: 'Published' as const,
      views: 245,
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      title: 'Water Supply Improvement',
      date: '2025-11-10',
      description: 'New water pipeline project approved. Work to commence next month.',
      status: 'Published' as const,
      views: 189,
    },
    {
      id: '3',
      panchayatId: 'panchayat-1',
      title: 'Vaccination Camp',
      date: '2025-11-08',
      description: 'Free vaccination camp organized on 20th Nov at Primary Health Center.',
      status: 'Draft' as const,
      views: 0,
    },
  ],
  members: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      name: 'Ramesh Kumar Singh',
      role: 'Sarpanch',
      ward: 'All Wards',
      phone: '+91 98XXX XXXXX',
      email: 'sarpanch@ramnagar.egramseva.gov.in',
      image: '',
      designation: 'Elected Representative',
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      name: 'Sunita Devi',
      role: 'Up-Sarpanch',
      ward: 'Ward 1-5',
      phone: '+91 97XXX XXXXX',
      email: 'upsarpanch@ramnagar.egramseva.gov.in',
      image: '',
      designation: 'Elected Representative',
    },
    {
      id: '3',
      panchayatId: 'panchayat-1',
      name: 'Rajesh Sharma',
      role: 'Panchayat Sachiv',
      ward: 'All Wards',
      phone: '+91 96XXX XXXXX',
      email: 'sachiv@ramnagar.egramseva.gov.in',
      image: '',
      designation: 'Administrative Officer',
    },
    {
      id: '4',
      panchayatId: 'panchayat-1',
      name: 'Anita Verma',
      role: 'Ward Member',
      ward: 'Ward 3',
      phone: '+91 95XXX XXXXX',
      email: 'ward3@ramnagar.egramseva.gov.in',
      image: '',
      designation: 'Elected Representative',
    },
  ],
  gallery: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      title: 'School Building Construction',
      image: 'https://images.unsplash.com/photo-1759738098462-90ffac98c554?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYWdlJTIwZGV2ZWxvcG1lbnQlMjBpbmRpYXxlbnwxfHx8fDE3NjI3NTIzNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'New school building construction project',
      category: 'Infrastructure',
      date: '2025-10-15',
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      title: 'Community Gathering',
      image: 'https://images.unsplash.com/photo-1759738098462-90ffac98c554?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGluZGlhJTIwY29tbXVuaXR5fGVufDF8fHx8MTc2MjY5MDg5OXww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Community meeting for village development',
      category: 'Events',
      date: '2025-10-20',
    },
    {
      id: '3',
      panchayatId: 'panchayat-1',
      title: 'Agricultural Training',
      image: 'https://images.unsplash.com/photo-1707721690544-781fe6ede937?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBhZ3JpY3VsdHVyZSUyMGZpZWxkfGVufDF8fHx8MTc2Mjc1MjM1OHww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Training program for farmers',
      category: 'Education',
      date: '2025-10-25',
    },
    {
      id: '4',
      panchayatId: 'panchayat-1',
      title: 'Road Construction',
      image: 'https://images.unsplash.com/photo-1709967884183-7ffa9d168508?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBnb3Zlcm5tZW50JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyNzUyMzU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'Road infrastructure development',
      category: 'Infrastructure',
      date: '2025-11-01',
    },
  ],
  projects: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      title: 'Road Infrastructure Development',
      description: 'Construction of 5km concrete road connecting main village to agricultural areas. Project includes proper drainage system and street lighting.',
      budget: '₹45,00,000',
      timeline: '6 months',
      status: 'In Progress' as const,
      progress: 65,
      wards: 'Ward 1, 2, 3',
      startDate: '2025-06-01',
      endDate: '2025-12-01',
      images: [],
    },
    {
      id: '2',
      panchayatId: 'panchayat-1',
      title: 'Community Water Supply System',
      description: 'Installation of new water pipeline network ensuring 24/7 clean water supply to all households. Includes water treatment plant and storage tanks.',
      budget: '₹35,00,000',
      timeline: '4 months',
      status: 'Completed' as const,
      progress: 100,
      wards: 'All Wards',
      startDate: '2025-05-01',
      endDate: '2025-09-01',
      images: [],
    },
  ],
  // New mock data
  adminUsers: [
    {
      id: 'admin-1',
      email: 'admin@egramseva.gov.in',
      name: 'Super Admin',
      role: 'super_admin' as const,
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2025-01-15T10:30:00Z',
    },
    {
      id: '1',
      email: 'sachiv@ramnagar.egramseva.gov.in',
      name: 'Rajesh Sharma',
      role: 'panchayat_admin' as const,
      panchayatId: 'panchayat-1',
      panchayatName: 'Ramnagar',
      status: 'active' as const,
      createdAt: '2024-06-01T00:00:00Z',
      lastLogin: '2025-01-15T09:00:00Z',
    },
  ],
  teamMembers: [
    {
      id: '1',
      panchayatId: 'panchayat-1',
      name: 'Rajesh Sharma',
      email: 'sachiv@ramnagar.egramseva.gov.in',
      role: 'Panchayat Sachiv',
      status: 'active' as UserStatus,
      createdAt: '2024-06-01T00:00:00Z',
      lastActive: '2025-01-15T09:00:00Z',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      panchayatId: 'panchayat-1',
      title: 'Annual Budget Report 2024',
      description: 'Complete budget allocation and expenditure report',
      category: 'Financial',
      fileUrl: '/documents/budget-2024.pdf',
      fileName: 'budget-2024.pdf',
      fileSize: 2048576,
      fileType: 'application/pdf',
      uploadedBy: 'Rajesh Sharma',
      uploadedAt: '2024-12-01T10:00:00Z',
      isPublic: true,
    },
  ],
  comments: [
    {
      id: 'comment-1',
      postId: '1',
      panchayatId: 'panchayat-1',
      author: 'Village Resident',
      authorEmail: 'resident@example.com',
      content: 'Great initiative! Looking forward to seeing the progress.',
      status: 'approved' as const,
      createdAt: '2025-01-10T14:30:00Z',
      approvedBy: 'Rajesh Sharma',
      approvedAt: '2025-01-10T15:00:00Z',
    },
  ],
  albums: [
    {
      id: 'album-1',
      panchayatId: 'panchayat-1',
      title: 'Infrastructure Development',
      description: 'Photos of ongoing infrastructure projects',
      coverImage: 'https://images.unsplash.com/photo-1759738098462-90ffac98c554',
      imageCount: 12,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-12-15T00:00:00Z',
    },
  ],
  settings: [
    {
      id: 'settings-1',
      panchayatId: 'panchayat-1',
      hero: {
        title: 'Welcome to Ramnagar Gram Panchayat',
        subtitle: 'Digital Governance for Rural India',
        description: 'Empowering our community through transparent governance',
        image: 'https://images.unsplash.com/photo-1736914319111-d54ada582633',
      },
      about: {
        title: 'About Ramnagar',
        content: 'Ramnagar Gram Panchayat is a vibrant rural community...',
        features: [
          '3 Primary Schools and 1 High School',
          'Primary Health Center with 24/7 services',
          'Community Hall and Sports Ground',
        ],
      },
      contact: {
        address: 'Ramnagar Gram Panchayat Bhawan, Varanasi, Uttar Pradesh - 221001',
        phone: '+91 542-XXXXXX',
        email: 'ramnagar@egramseva.gov.in',
        officeHours: 'Monday - Friday: 10:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM',
      },
      logo: undefined,
      updatedAt: '2024-12-01T00:00:00Z',
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      userId: '1',
      userName: 'Rajesh Sharma',
      action: 'CREATE',
      resource: 'Post',
      resourceId: '1',
      details: { title: 'New Post' },
      ipAddress: '192.168.1.1',
      createdAt: '2025-01-15T10:00:00Z',
    },
  ],
};

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Auth API
 */
export const authAPI = {
  login: async (email: string, password: string) => {
    await delay(1000);
    const user = mockData.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = `mock-token-${user.id}-${Date.now()}`;
    return { user: userWithoutPassword, token };
  },

  logout: async () => {
    await delay(500);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  },

  getCurrentUser: async () => {
    await delay(500);
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');
    const userId = token.split('-')[2];
    const user = mockData.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};

/**
 * Panchayat API
 */
export const panchayatAPI = {
  getAll: async (): Promise<ActivePanchayat[]> => {
    await delay(800);
    return mockData.panchayats.map((p) => ({
      name: p.name,
      district: `${p.district}, ${p.state}`,
      schemes: mockData.schemes.filter((s) => s.panchayatId === p.id).length,
      population: p.population,
      subdomain: p.subdomain,
    }));
  },

  getById: async (id: string) => {
    await delay(600);
    const panchayat = mockData.panchayats.find((p) => p.id === id);
    if (!panchayat) throw new Error('Panchayat not found');
    return panchayat;
  },

  getBySubdomain: async (subdomain: string): Promise<PanchayatDetails> => {
    await delay(600);
    const panchayat = mockData.panchayats.find((p) => p.subdomain === subdomain);
    if (!panchayat) throw new Error('Panchayat not found');
    return panchayat as PanchayatDetails;
  },

  getDetails: async (id: string): Promise<PanchayatDetails> => {
    await delay(600);
    const panchayat = mockData.panchayats.find((p) => p.id === id);
    if (!panchayat) throw new Error('Panchayat not found');
    return panchayat as PanchayatDetails;
  },

  register: async (data: RegistrationFormData) => {
    await delay(2000);
    const newPanchayat = {
      id: `panchayat-${Date.now()}`,
      name: data.panchayatName,
      district: data.district,
      state: data.state,
      block: data.block,
      population: parseInt(data.population) || 0,
      area: data.area,
      wards: parseInt(data.wards) || 0,
      subdomain: data.subdomain,
      established: new Date().getFullYear(),
      description: `${data.panchayatName} Gram Panchayat is a vibrant rural community.`,
      heroImage: 'https://images.unsplash.com/photo-1736914319111-d54ada582633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB2aWxsYWdlJTIwcGFuY2hheWF0fGVufDF8fHx8MTc2Mjc1MjM1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      contactInfo: {
        address: `${data.panchayatName} Gram Panchayat Bhawan, ${data.district}, ${data.state}`,
        phone: '+91 XXXXX XXXXX',
        email: `${data.subdomain}@egramseva.gov.in`,
        officeHours: 'Monday - Friday: 10:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM',
      },
      features: [] as string[],
    };
    (mockData.panchayats as PanchayatDetails[]).push(newPanchayat as PanchayatDetails);
    return { success: true, panchayat: newPanchayat as PanchayatDetails };
  },
};

/**
 * Posts API
 */
export const postsAPI = {
  getAll: async (panchayatId?: string): Promise<Post[]> => {
    await delay(700);
    let posts = [...mockData.posts];
    if (panchayatId) {
      posts = posts.filter((p) => p.panchayatId === panchayatId);
    }
    return posts;
  },

  getById: async (id: string): Promise<Post> => {
    await delay(500);
    const post = mockData.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found');
    return post;
  },

  create: async (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares'>): Promise<Post> => {
    await delay(1000);
    if (!post.panchayatId) {
      throw new Error('panchayatId is required');
    }
    const newPost: Post = {
      ...post,
      panchayatId: post.panchayatId,
      id: `post-${Date.now()}`,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
    };
    (mockData.posts as Post[]).unshift(newPost);
    return newPost;
  },

  update: async (id: string, updates: Partial<Post>): Promise<Post> => {
    await delay(800);
    const index = mockData.posts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Post not found');
    (mockData.posts as Post[])[index] = { ...mockData.posts[index], ...updates } as Post;
    return mockData.posts[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const index = mockData.posts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Post not found');
    mockData.posts.splice(index, 1);
  },

  like: async (id: string): Promise<number> => {
    await delay(300);
    const post = mockData.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found');
    post.likes += 1;
    return post.likes;
  },
};

/**
 * Schemes API
 */
export const schemesAPI = {
  getAll: async (panchayatId?: string): Promise<Scheme[]> => {
    await delay(700);
    let schemes = [...mockData.schemes];
    if (panchayatId) {
      schemes = schemes.filter((s) => s.panchayatId === panchayatId);
    }
    return schemes;
  },

  getById: async (id: string): Promise<Scheme> => {
    await delay(500);
    const scheme = mockData.schemes.find((s) => s.id === id);
    if (!scheme) throw new Error('Scheme not found');
    return scheme;
  },

  create: async (scheme: Omit<Scheme, 'id'>): Promise<Scheme> => {
    await delay(1000);
    if (!scheme.panchayatId) {
      throw new Error('panchayatId is required');
    }
    const newScheme: Scheme = {
      ...scheme,
      panchayatId: scheme.panchayatId,
      id: `scheme-${Date.now()}`,
    };
    (mockData.schemes as Scheme[]).push(newScheme);
    return newScheme;
  },

  update: async (id: string, updates: Partial<Scheme>): Promise<Scheme> => {
    await delay(800);
    const index = mockData.schemes.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Scheme not found');
    (mockData.schemes as Scheme[])[index] = { ...mockData.schemes[index], ...updates } as Scheme;
    return mockData.schemes[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const index = mockData.schemes.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Scheme not found');
    mockData.schemes.splice(index, 1);
  },
};

/**
 * Announcements API
 */
export const announcementsAPI = {
  getAll: async (panchayatId?: string): Promise<Announcement[]> => {
    await delay(700);
    let announcements = [...mockData.announcements];
    if (panchayatId) {
      announcements = announcements.filter((a) => a.panchayatId === panchayatId);
    }
    return announcements;
  },

  create: async (announcement: Omit<Announcement, 'id' | 'views'>): Promise<Announcement> => {
    await delay(1000);
    if (!announcement.panchayatId) {
      throw new Error('panchayatId is required');
    }
    const newAnnouncement: Announcement = {
      ...announcement,
      panchayatId: announcement.panchayatId,
      id: `announcement-${Date.now()}`,
      views: 0,
    };
    (mockData.announcements as Announcement[]).unshift(newAnnouncement);
    return newAnnouncement;
  },

  update: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    await delay(800);
    const index = mockData.announcements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found');
    mockData.announcements[index] = { ...mockData.announcements[index], ...updates };
    return mockData.announcements[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const index = mockData.announcements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found');
    mockData.announcements.splice(index, 1);
  },
};

/**
 * Members API
 */
export const membersAPI = {
  getAll: async (panchayatId?: string): Promise<PanchayatMember[]> => {
    await delay(700);
    let members = [...mockData.members];
    if (panchayatId) {
      members = members.filter((m) => m.panchayatId === panchayatId);
    }
    return members;
  },

  getById: async (id: string): Promise<PanchayatMember> => {
    await delay(500);
    const member = mockData.members.find((m) => m.id === id);
    if (!member) throw new Error('Member not found');
    return member;
  },
};

/**
 * Gallery API
 */
export const galleryAPI = {
  getAll: async (panchayatId?: string): Promise<GalleryItem[]> => {
    await delay(700);
    let gallery = [...mockData.gallery];
    if (panchayatId) {
      gallery = gallery.filter((g) => g.panchayatId === panchayatId);
    }
    return gallery;
  },

  getById: async (id: string): Promise<GalleryItem> => {
    await delay(500);
    const item = mockData.gallery.find((g) => g.id === id);
    if (!item) throw new Error('Gallery item not found');
    return item;
  },

  create: async (item: Omit<GalleryItem, 'id'>): Promise<GalleryItem> => {
    await delay(1000);
    if (!item.panchayatId) {
      throw new Error('panchayatId is required');
    }
    const newItem: GalleryItem = {
      ...item,
      panchayatId: item.panchayatId,
      id: `gallery-${Date.now()}`,
    };
    (mockData.gallery as GalleryItem[]).unshift(newItem);
    return newItem;
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const index = mockData.gallery.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Gallery item not found');
    mockData.gallery.splice(index, 1);
  },
};

/**
 * Projects API
 */
export const projectsAPI = {
  getAll: async (panchayatId?: string): Promise<Project[]> => {
    await delay(700);
    let projects = [...mockData.projects];
    if (panchayatId) {
      projects = projects.filter((p) => p.panchayatId === panchayatId);
    }
    return projects;
  },

  getById: async (id: string): Promise<Project> => {
    await delay(500);
    const project = mockData.projects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  },

  create: async (project: Omit<Project, 'id'>): Promise<Project> => {
    await delay(1000);
    if (!project.panchayatId) {
      throw new Error('panchayatId is required');
    }
    const newProject: Project = {
      ...project,
      panchayatId: project.panchayatId,
      id: `project-${Date.now()}`,
    };
    (mockData.projects as Project[]).unshift(newProject);
    return newProject;
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    await delay(800);
    const index = mockData.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    (mockData.projects as Project[])[index] = { ...mockData.projects[index], ...updates } as Project;
    return mockData.projects[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const index = mockData.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    mockData.projects.splice(index, 1);
  },
};

/**
 * Analytics API
 */
export const analyticsAPI = {
  getStats: async (panchayatId: string) => {
    await delay(800);
    return {
      totalVisitors: 12458,
      activeSchemes: mockData.schemes.filter((s) => s.panchayatId === panchayatId).length,
      announcements: mockData.announcements.filter((a) => a.panchayatId === panchayatId).length,
      photoGallery: mockData.gallery.filter((g) => g.panchayatId === panchayatId).length,
    };
  },

  getOverview: async (panchayatId: string): Promise<AnalyticsOverview> => {
    await delay(800);
    return {
      totalVisitors: 12458,
      activeSchemes: mockData.schemes.filter((s) => s.panchayatId === panchayatId).length,
      announcements: mockData.announcements.filter((a) => a.panchayatId === panchayatId).length,
      photoGallery: mockData.gallery.filter((g) => g.panchayatId === panchayatId).length,
      totalPosts: mockData.posts.filter((p) => p.panchayatId === panchayatId).length,
      totalComments: mockData.comments.filter((c) => c.panchayatId === panchayatId).length,
      totalLikes: mockData.posts.filter((p) => p.panchayatId === panchayatId).reduce((sum, p) => sum + p.likes, 0),
    };
  },

  getPageViews: async (_panchayatId: string): Promise<PageView[]> => {
    await delay(800);
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });
    return dates.map((date) => ({
      date,
      views: Math.floor(Math.random() * 500) + 100,
      uniqueVisitors: Math.floor(Math.random() * 200) + 50,
    }));
  },

  getPopularPosts: async (panchayatId: string): Promise<PopularPost[]> => {
    await delay(800);
    return mockData.posts
      .filter((p) => p.panchayatId === panchayatId)
      .map((p) => ({
        id: p.id,
        title: p.content.substring(0, 50) + '...',
        views: Math.floor(Math.random() * 1000) + 100,
        likes: p.likes,
        comments: p.comments,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  },

  getEngagement: async (panchayatId: string): Promise<EngagementStats> => {
    await delay(800);
    const posts = mockData.posts.filter((p) => p.panchayatId === panchayatId);
    return {
      totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
      totalComments: posts.reduce((sum, p) => sum + p.comments, 0),
      totalShares: posts.reduce((sum, p) => sum + p.shares, 0),
      averageEngagement: posts.length > 0 ? (posts.reduce((sum, p) => sum + p.likes + p.comments, 0) / posts.length) : 0,
      topEngagedPosts: posts
        .map((p) => ({
          id: p.id,
          title: p.content.substring(0, 50) + '...',
          views: Math.floor(Math.random() * 1000) + 100,
          likes: p.likes,
          comments: p.comments,
        }))
        .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
        .slice(0, 5),
    };
  },
};

/**
 * Super Admin API
 */
export const superAdminAPI = {
  // Panchayat Management
  createPanchayat: async (data: {
    name: string;
    subdomain: string;
    district: string;
    state: string;
    block: string;
    population: number;
    area: string;
    wards: number;
  }) => {
    await delay(1500);
    const newPanchayat: SuperAdminPanchayat = {
      id: `panchayat-${Date.now()}`,
      name: data.name,
      subdomain: data.subdomain,
      district: data.district,
      state: data.state,
      status: 'active',
      adminCount: 0,
      createdAt: new Date().toISOString(),
    };
    (mockData.panchayats as any[]).push({
      ...newPanchayat,
      block: data.block,
      population: data.population,
      area: data.area,
      wards: data.wards,
      established: new Date().getFullYear(),
    });
    return newPanchayat;
  },

  getAllPanchayats: async (filters?: { status?: PanchayatStatus; search?: string }): Promise<SuperAdminPanchayat[]> => {
    await delay(800);
    let panchayats = mockData.panchayats.map((p) => ({
      id: p.id,
      name: p.name,
      subdomain: p.subdomain,
      district: p.district,
      state: p.state,
      status: 'active' as PanchayatStatus,
      adminCount: mockData.teamMembers.filter((tm) => tm.panchayatId === p.id).length,
      createdAt: '2024-01-01T00:00:00Z',
    }));
    if (filters?.status) {
      panchayats = panchayats.filter((p) => p.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      panchayats = panchayats.filter((p) => 
        p.name.toLowerCase().includes(search) || 
        p.subdomain.toLowerCase().includes(search) ||
        p.district.toLowerCase().includes(search)
      );
    }
    return panchayats;
  },

  getPanchayatById: async (id: string): Promise<SuperAdminPanchayat> => {
    await delay(600);
    const panchayat = mockData.panchayats.find((p) => p.id === id);
    if (!panchayat) throw new Error('Panchayat not found');
    return {
      id: panchayat.id,
      name: panchayat.name,
      subdomain: panchayat.subdomain,
      district: panchayat.district,
      state: panchayat.state,
      status: 'active',
      adminCount: mockData.teamMembers.filter((tm) => tm.panchayatId === id).length,
      createdAt: '2024-01-01T00:00:00Z',
    };
  },

  updatePanchayat: async (id: string, updates: Partial<SuperAdminPanchayat>) => {
    await delay(800);
    const index = mockData.panchayats.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Panchayat not found');
    Object.assign(mockData.panchayats[index], updates);
    return mockData.panchayats[index];
  },

  updatePanchayatStatus: async (id: string, status: PanchayatStatus) => {
    await delay(600);
    const panchayat = mockData.panchayats.find((p) => p.id === id);
    if (!panchayat) throw new Error('Panchayat not found');
    return { success: true, status };
  },

  deletePanchayat: async (id: string) => {
    await delay(600);
    const index = mockData.panchayats.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Panchayat not found');
    mockData.panchayats.splice(index, 1);
    return { success: true };
  },

  getPanchayatStats: async (id: string) => {
    await delay(800);
    return {
      totalPosts: mockData.posts.filter((p) => p.panchayatId === id).length,
      totalSchemes: mockData.schemes.filter((s) => s.panchayatId === id).length,
      totalAnnouncements: mockData.announcements.filter((a) => a.panchayatId === id).length,
      adminCount: mockData.teamMembers.filter((tm) => tm.panchayatId === id).length,
      totalVisitors: 12458,
    };
  },

  // User Management
  getAllUsers: async (): Promise<AdminUser[]> => {
    await delay(800);
    return [...mockData.adminUsers];
  },

  getUserById: async (id: string): Promise<AdminUser> => {
    await delay(600);
    const user = mockData.adminUsers.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateUserStatus: async (id: string, status: UserStatus) => {
    await delay(600);
    const user = mockData.adminUsers.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    (user as AdminUser).status = status;
    return user;
  },

  getPanchayatAdmins: async (panchayatId: string): Promise<TeamMember[]> => {
    await delay(600);
    return mockData.teamMembers.filter((tm) => tm.panchayatId === panchayatId);
  },

  // System Analytics
  getSystemAnalytics: async () => {
    await delay(800);
    return {
      totalPanchayats: mockData.panchayats.length,
      totalUsers: mockData.adminUsers.length,
      activePanchayats: mockData.panchayats.length,
      totalPosts: mockData.posts.length,
      totalSchemes: mockData.schemes.length,
    };
  },

  getPanchayatAnalytics: async (panchayatId: string) => {
    await delay(800);
    return {
      posts: mockData.posts.filter((p) => p.panchayatId === panchayatId).length,
      schemes: mockData.schemes.filter((s) => s.panchayatId === panchayatId).length,
      announcements: mockData.announcements.filter((a) => a.panchayatId === panchayatId).length,
      visitors: 12458,
    };
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    await delay(800);
    return [...mockData.auditLogs];
  },
};

/**
 * Team Management API
 */
export const teamAPI = {
  addMember: async (panchayatId: string, data: { name: string; email: string; role: string }) => {
    await delay(1000);
    // Check max 4 constraint
    const existingMembers = mockData.teamMembers.filter((tm) => tm.panchayatId === panchayatId);
    if (existingMembers.length >= 4) {
      throw new Error('Maximum 4 admins allowed per panchayat');
    }
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      panchayatId,
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'active' as UserStatus,
      createdAt: new Date().toISOString(),
      lastActive: undefined,
    };
    (mockData.teamMembers as TeamMember[]).push(newMember);
    return newMember;
  },

  getAllMembers: async (panchayatId: string): Promise<TeamMember[]> => {
    await delay(700);
    return mockData.teamMembers.filter((tm) => tm.panchayatId === panchayatId);
  },

  removeMember: async (userId: string) => {
    await delay(600);
    const index = mockData.teamMembers.findIndex((tm) => tm.id === userId);
    if (index === -1) throw new Error('Team member not found');
    mockData.teamMembers.splice(index, 1);
    return { success: true };
  },

  updateMemberStatus: async (userId: string, status: UserStatus) => {
    await delay(600);
    const member = mockData.teamMembers.find((tm) => tm.id === userId);
    if (!member) throw new Error('Team member not found');
    (member as TeamMember).status = status;
    return member;
  },
};

/**
 * Documents API
 */
export const documentsAPI = {
  upload: async (panchayatId: string, file: File, data: { title: string; description?: string; category: string; isPublic: boolean }): Promise<Document> => {
    await delay(2000);
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      panchayatId,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: 'Current User',
      uploadedAt: new Date().toISOString(),
      isPublic: data.isPublic,
    };
    (mockData.documents as Document[]).push(newDoc);
    return newDoc;
  },

  getAll: async (panchayatId: string, category?: string): Promise<Document[]> => {
    await delay(700);
    let docs = mockData.documents.filter((d) => d.panchayatId === panchayatId);
    if (category) {
      docs = docs.filter((d) => d.category === category);
    }
    return docs;
  },

  getById: async (id: string): Promise<Document> => {
    await delay(500);
    const doc = mockData.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  update: async (id: string, updates: Partial<Document>): Promise<Document> => {
    await delay(800);
    const index = mockData.documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Document not found');
    Object.assign(mockData.documents[index], updates);
    return mockData.documents[index];
  },

  delete: async (id: string) => {
    await delay(600);
    const index = mockData.documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Document not found');
    mockData.documents.splice(index, 1);
    return { success: true };
  },
};

/**
 * Comments API
 */
export const commentsAPI = {
  getByPost: async (postId: string): Promise<Comment[]> => {
    await delay(700);
    return mockData.comments.filter((c) => c.postId === postId);
  },

  create: async (panchayatId: string, postId: string, data: { author: string; authorEmail?: string; content: string }): Promise<Comment> => {
    await delay(1000);
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      panchayatId,
      author: data.author,
      authorEmail: data.authorEmail || undefined,
      content: data.content,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    (mockData.comments as Comment[]).push(newComment);
    // Update post comment count
    const post = mockData.posts.find((p) => p.id === postId);
    if (post) post.comments += 1;
    return newComment;
  },

  approve: async (postId: string, commentId: string) => {
    await delay(600);
    const comment = mockData.comments.find((c) => c.id === commentId && c.postId === postId);
    if (!comment) throw new Error('Comment not found');
    comment.status = 'approved';
    comment.approvedBy = 'Current Admin';
    comment.approvedAt = new Date().toISOString();
    return comment;
  },

  delete: async (postId: string, commentId: string) => {
    await delay(600);
    const index = mockData.comments.findIndex((c) => c.id === commentId && c.postId === postId);
    if (index === -1) throw new Error('Comment not found');
    mockData.comments.splice(index, 1);
    // Update post comment count
    const post = mockData.posts.find((p) => p.id === postId);
    if (post && post.comments > 0) post.comments -= 1;
    return { success: true };
  },
};

/**
 * Albums API
 */
export const albumsAPI = {
  create: async (panchayatId: string, data: { title: string; description?: string; coverImage?: string }): Promise<Album> => {
    await delay(1000);
    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      panchayatId,
      title: data.title,
      description: data.description || undefined,
      coverImage: data.coverImage || undefined,
      imageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (mockData.albums as Album[]).push(newAlbum);
    return newAlbum;
  },

  getAll: async (panchayatId: string): Promise<Album[]> => {
    await delay(700);
    return mockData.albums.filter((a) => a.panchayatId === panchayatId);
  },

  getById: async (id: string): Promise<Album> => {
    await delay(500);
    const album = mockData.albums.find((a) => a.id === id);
    if (!album) throw new Error('Album not found');
    return album;
  },

  update: async (id: string, updates: Partial<Album>): Promise<Album> => {
    await delay(800);
    const index = mockData.albums.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Album not found');
    Object.assign(mockData.albums[index], { ...updates, updatedAt: new Date().toISOString() });
    return mockData.albums[index];
  },

  delete: async (id: string) => {
    await delay(600);
    const index = mockData.albums.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Album not found');
    mockData.albums.splice(index, 1);
    return { success: true };
  },
};

/**
 * Settings API
 */
export const settingsAPI = {
  get: async (panchayatId: string): Promise<PanchayatSettings> => {
    await delay(700);
    const settings = mockData.settings.find((s) => s.panchayatId === panchayatId);
    if (!settings) throw new Error('Settings not found');
    return settings;
  },

  update: async (panchayatId: string, updates: Partial<PanchayatSettings>): Promise<PanchayatSettings> => {
    await delay(1000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    Object.assign(mockData.settings[index], { ...updates, updatedAt: new Date().toISOString() });
    return mockData.settings[index];
  },

  updateHero: async (panchayatId: string, hero: PanchayatSettings['hero']): Promise<PanchayatSettings> => {
    await delay(1000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    (mockData.settings[index] as PanchayatSettings).hero = hero;
    mockData.settings[index].updatedAt = new Date().toISOString();
    return mockData.settings[index] as PanchayatSettings;
  },

  updateAbout: async (panchayatId: string, about: PanchayatSettings['about']): Promise<PanchayatSettings> => {
    await delay(1000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    mockData.settings[index].about = about;
    mockData.settings[index].updatedAt = new Date().toISOString();
    return mockData.settings[index];
  },

  updateContact: async (panchayatId: string, contact: PanchayatSettings['contact']): Promise<PanchayatSettings> => {
    await delay(1000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    mockData.settings[index].contact = contact;
    mockData.settings[index].updatedAt = new Date().toISOString();
    return mockData.settings[index];
  },

  uploadLogo: async (panchayatId: string, file: File): Promise<PanchayatSettings> => {
    await delay(2000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    (mockData.settings[index] as PanchayatSettings).logo = URL.createObjectURL(file);
    mockData.settings[index].updatedAt = new Date().toISOString();
    return mockData.settings[index] as PanchayatSettings;
  },

  uploadHeroImage: async (panchayatId: string, file: File): Promise<PanchayatSettings> => {
    await delay(2000);
    const index = mockData.settings.findIndex((s) => s.panchayatId === panchayatId);
    if (index === -1) throw new Error('Settings not found');
    mockData.settings[index].hero.image = URL.createObjectURL(file);
    mockData.settings[index].updatedAt = new Date().toISOString();
    return mockData.settings[index];
  },
};

/**
 * Enhanced Auth API
 */
export const authAPIEnhanced = {
  ...authAPI,
  
  register: async (data: { name: string; email: string; password: string; panchayatId: string }) => {
    await delay(1500);
    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'panchayat_admin' as const,
      panchayatId: data.panchayatId,
      panchayatName: 'New Panchayat',
      status: 'active' as UserStatus,
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
    };
    (mockData.adminUsers as AdminUser[]).push(newUser);
    const { password: _, ...userWithoutPassword } = newUser as any;
    const token = `mock-token-${newUser.id}-${Date.now()}`;
    return { user: userWithoutPassword, token };
  },

  forgotPassword: async (email: string) => {
    await delay(1000);
    const user = mockData.adminUsers.find((u) => u.email === email);
    if (!user) {
      // Don't reveal if user exists for security
      return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    }
    return { success: true, message: 'Password reset link sent to your email.' };
  },

  resetPassword: async (_token: string, _newPassword: string) => {
    await delay(1000);
    // In real implementation, validate token
    return { success: true, message: 'Password reset successfully.' };
  },

  updateProfile: async (updates: { name?: string; email?: string }) => {
    await delay(800);
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');
    const userId = token.split('-')[2];
    const user = mockData.adminUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    return user;
  },

  changePassword: async (_currentPassword: string, _newPassword: string) => {
    await delay(800);
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');
    // In real implementation, verify current password
    return { success: true, message: 'Password changed successfully.' };
  },
};

// Update posts API to support status
export const postsAPIEnhanced = {
  ...postsAPI,
  
  publish: async (id: string) => {
    await delay(600);
    const post = mockData.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found');
    return { ...post, status: 'published' };
  },

  getLikes: async (id: string) => {
    await delay(500);
    const post = mockData.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found');
    return { likes: post.likes };
  },
};

// Update announcements API
export const announcementsAPIEnhanced = {
  ...announcementsAPI,
  
  getById: async (id: string): Promise<Announcement> => {
    await delay(500);
    const announcement = mockData.announcements.find((a) => a.id === id);
    if (!announcement) throw new Error('Announcement not found');
    return announcement;
  },

  updateStatus: async (id: string, status: 'Published' | 'Draft') => {
    await delay(600);
    const announcement = mockData.announcements.find((a) => a.id === id);
    if (!announcement) throw new Error('Announcement not found');
    announcement.status = status;
    return announcement;
  },
};

// Update schemes API
export const schemesAPIEnhanced = {
  ...schemesAPI,
  
  updateStatus: async (id: string, status: 'Active' | 'Completed' | 'Pending') => {
    await delay(600);
    const scheme = mockData.schemes.find((s) => s.id === id);
    if (!scheme) throw new Error('Scheme not found');
    (scheme as Scheme).status = status as Scheme['status'];
    return scheme;
  },
};

// Update gallery API
export const galleryAPIEnhanced = {
  ...galleryAPI,
  
  update: async (id: string, updates: Partial<GalleryItem>): Promise<GalleryItem> => {
    await delay(800);
    const index = mockData.gallery.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Gallery item not found');
    Object.assign(mockData.gallery[index], updates);
    return mockData.gallery[index];
  },
};

export default api;

