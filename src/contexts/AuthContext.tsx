/**
 * Authentication Context
 * Manages user authentication state using Redux
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginAction, logout as logoutAction, getCurrentUser } from '../store/slices/authSlice';
import { toast } from 'sonner';
import type { User as ApiUser } from '../types/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "panchayat_admin" | "user";
  panchayatId?: string;
  panchayatName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map API user to context user
const mapApiUserToContextUser = (apiUser: ApiUser): User => {
  const mappedRole =
    apiUser.role === 'PANCHAYAT_ADMIN'
      ? 'panchayat_admin'
      : apiUser.role === 'SUPER_ADMIN'
      ? 'super_admin'
      : 'user';

  return {
    id: apiUser.userId.toString(),
    email: apiUser.email,
    name: apiUser.name,
    role: mappedRole as "super_admin" | "panchayat_admin" | "user",
    panchayatId: apiUser.panchayatId?.toString(),
    panchayatName: apiUser.panchayatName,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user: reduxUser, loading, isAuthenticated } = useAppSelector((state) => state.auth);

  // Map Redux user to context user format
  const user = reduxUser ? mapApiUserToContextUser(reduxUser) : null;

  useEffect(() => {
    // Check for existing session and fetch current user
    const token = localStorage.getItem('authToken');
    if (token && !reduxUser) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, reduxUser]);

  const login = async (email: string, password: string) => {
    try {
      await dispatch(loginAction({ email, password })).unwrap();
      toast.success('Login successful!');
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await dispatch(logoutAction()).unwrap();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

