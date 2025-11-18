/**
 * API Testing Utility
 * Use this to test API endpoints in the browser console
 */

import { publicAPI, authAPI, postsAPI, teamAPI, adminPanchayatsAPI } from '../services/api';

// Make APIs available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).testAPI = {
    // Public APIs
    getAllPanchayats: () => publicAPI.getAllPanchayats(),
    getAllPanchayatsSimple: () => publicAPI.getAllPanchayatsSimple(),
    getPanchayatBySlug: (slug: string) => publicAPI.getPanchayatBySlug(slug),
    getPublicPosts: (slug: string, params?: any) => publicAPI.getPublicPosts(slug, params),
    
    // Auth APIs (will need credentials)
    login: (email: string, password: string) => authAPI.login({ email, password }),
    register: (email: string, name: string, panchayatSlug: string, password: string, phone: string) =>
      authAPI.register({ email, name, panchayatSlug, password, phone }),
    getCurrentUser: () => authAPI.getCurrentUser(),
    logout: () => authAPI.logout(),
    
    // Authenticated APIs (need to login first)
    getPosts: (params?: any) => postsAPI.getAllPosts(params),
    getTeamMembers: (params?: any) => teamAPI.getTeamMembers(params),
    
    // Admin APIs (need super admin login)
    adminGetPanchayats: (params?: any) => adminPanchayatsAPI.getAllPanchayats(params),
  };
  
  console.log('🧪 Test API loaded! Use window.testAPI to test endpoints.');
  console.log('Examples:');
  console.log('  await testAPI.getAllPanchayats()');
  console.log('  await testAPI.getPanchayatBySlug("narkhed")');
  console.log('  await testAPI.register("email@example.com", "Name", "panchayat-slug", "Password@123", "1234567890")');
  console.log('  await testAPI.login("email@example.com", "password")');
}

export {};

