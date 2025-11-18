import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600, // Increase limit slightly to reduce warnings
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Redux
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'redux-vendor';
            }
            // UI libraries (Radix UI)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Other node_modules
            return 'vendor';
          }

          // Split large components into separate chunks
          if (id.includes('/components/sachiv/')) {
            return 'sachiv-dashboard';
          }
          if (id.includes('/components/admin/')) {
            return 'admin-dashboard';
          }
          if (id.includes('/components/public/')) {
            return 'public-pages';
          }
        },
      },
    },
  },
});

