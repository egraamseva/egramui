/**
 * Global Loader Component
 * Shows a full-page loader overlay when any API call is in progress
 */

import { useLoading } from '../../contexts/LoadingContext';
import { Loader2 } from 'lucide-react';

export function GlobalLoader() {
  const { loading } = useLoading();

  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 bg-white rounded-lg p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF9933]" />
        <p className="text-sm font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

