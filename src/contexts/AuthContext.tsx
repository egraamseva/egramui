/**
 * Authentication Context
 * Manages user authentication state using Redux only (no local state)
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginAction, logout as logoutAction } from '../store/slices/authSlice';
import { toast } from 'sonner';
import type { User as ApiUser } from '../types/api';

interface User {
  userId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "PANCHAYAT_ADMIN" | "PANCHAYAT_USER";
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

// Helper function to map API user to context user (unified, consistent with interface)
const mapApiUserToContextUser = (apiUser: ApiUser): User => ({
  userId: String(apiUser.userId),
  email: apiUser.email,
  name: apiUser.name,
  role:
    apiUser.role === 'SUPER_ADMIN'
      ? 'SUPER_ADMIN'
      : apiUser.role === 'PANCHAYAT_ADMIN'
      ? 'PANCHAYAT_ADMIN'
      : 'PANCHAYAT_USER',
  panchayatId: apiUser.panchayatId ? String(apiUser.panchayatId) : undefined,
  panchayatName: apiUser.panchayatName,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user: reduxUser, loading, isAuthenticated } = useAppSelector((state) => state.auth);

  // Map Redux user to context user format
  const user = reduxUser ? mapApiUserToContextUser(reduxUser) : null;

  // Only deal with login/logout using Redux actions
  const login = async (email: string, password: string) => {
    try {
      await dispatch(loginAction({ email, password })).unwrap();
      toast.success('Login successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

