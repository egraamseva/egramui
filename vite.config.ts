import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  // Base public path when served in production
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-table-header',
      '@tiptap/extension-link',
      '@tiptap/extension-underline',
      '@tiptap/extension-character-count',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure assets are properly referenced
    assetsDir: 'assets',
    // Improve chunk splitting for better caching and loading
    rollupOptions: {
      output: {
        // Use consistent chunk naming with hash for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Better chunk splitting strategy
        manualChunks: (id) => {
          // Split vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@tiptap')) {
              return 'vendor-tiptap';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-maps';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Ensure proper module resolution for dynamic imports
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  // Server configuration for development
  server: {
    fs: {
      strict: true,
    },
  },
})