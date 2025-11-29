/**
 * Global Loading Context
 * Manages global loading state for all API calls
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LoadingContextType {
  loading: boolean;
  loadingCount: number;
  setLoading: (loading: boolean) => void;
  incrementLoading: () => void;
  decrementLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    // Subscribe to global loading manager from HttpClient
    let unsubscribe: (() => void) | undefined;
    
    import('../routes/api').then((module) => {
      const manager = module.getLoadingManager();
      
      unsubscribe = manager.subscribe((loading: boolean) => {
        setLoadingCount((prev) => {
          if (loading) {
            return prev + 1;
          } else {
            return Math.max(0, prev - 1);
          }
        });
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const incrementLoading = () => {
    setLoadingCount((prev) => prev + 1);
  };

  const decrementLoading = () => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  };

  const setLoading = (loading: boolean) => {
    if (loading) {
      incrementLoading();
    } else {
      decrementLoading();
    }
  };

  return (
    <LoadingContext.Provider
      value={{
        loading: loadingCount > 0,
        loadingCount,
        setLoading,
        incrementLoading,
        decrementLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
