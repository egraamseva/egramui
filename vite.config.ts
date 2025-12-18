import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// Plugin to fix React Router 7 + React 19 compatibility issue
const reactRouterFixPlugin = () => {
  return {
    name: 'react-router-fix',
    transform(code: string, id: string) {
      // Transform React Router code to handle undefined Activity property
      if (id.includes('react-router') && code.includes('Activity')) {
        // Wrap property assignments that might fail
        const transformed = code.replace(
          /(\w+)\.Activity\s*=/g,
          '($1 || {}).Activity ='
        );
        if (transformed !== code) {
          return { code: transformed, map: null };
        }
      }
      return null;
    },
    generateBundle(options, bundle) {
      // Post-process bundled files if needed
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.code) {
          // Fix any remaining Activity property assignments on undefined
          chunk.code = chunk.code.replace(
            /(\w+)\.Activity\s*=/g,
            '($1 || {}).Activity ='
          );
        }
      }
    }
  }
}

export default defineConfig({
  // Base public path when served in production
  base: '/',
  plugins: [
    react(),
    reactRouterFixPlugin(),
  ],
  define: {
    // Ensure proper global object for React Router and other libraries
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      // Note: Excluding react-router-dom from optimizeDeps to avoid initialization order issues
      // It will be bundled normally but won't be pre-bundled
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
    // Exclude react-router-dom from pre-bundling to avoid React 19 compatibility issues
    exclude: ['react-router-dom'],
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
            // Keep React, React DOM, and React Router together to avoid initialization issues
            // React Router 7 needs React to be fully initialized before it can set properties
            if ((id.includes('react') || id.includes('react-dom') || id.includes('react-router')) && 
                !id.includes('react-redux') && !id.includes('react-i18next') && !id.includes('react-leaflet')) {
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