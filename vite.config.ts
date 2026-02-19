import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  // Dependency optimization - pre-bundle commonly used dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'date-fns',
      'zod',
      '@radix-ui/react-slot',
      '@tanstack/react-query',
    ],
    force: true,
    esbuildOptions: {
      // Ensure tree shaking works properly
      treeShaking: true,
    },
  },
  build: {
    // Target modern browsers for better performance
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Use esbuild for minification (built-in, no additional packages needed)
    minify: 'esbuild',
    esbuildOptions: {
      // Drop console in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      // Tree shaking
      treeShaking: true,
    },
    // Rollup chunking strategy
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting
        manualChunks: (id) => {
          // React core - separate vendor chunk
          if (id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          // Radix UI components - all @radix-ui packages
          if (id.includes('@radix-ui/react-')) {
            return 'radix-ui';
          }
          // Recharts - large charting library
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'charts';
          }
          // Lucide React - icon library
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Form handling libraries
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms';
          }
          // UI utilities
          if (id.includes('class-variance-authority') || 
              id.includes('tailwind-merge') || 
              id.includes('clsx')) {
            return 'ui-utils';
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
            return 'date-utils';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Query/state management
          if (id.includes('@tanstack') || id.includes('zustand') || id.includes('jotai')) {
            return 'state';
          }
          // Node modules - catch-all for other vendor code
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Enable chunking
    chunkSizeWarningLimit: 500,
    // Generate sourcemaps for production debugging (set to false for smaller builds)
    sourcemap: false,
    // CommonJS options
    commonjsOptions: {
      include: [/node_modules/],
      // Transform named exports for better tree shaking
      transformMixedEsModules: true,
    },
  },
  // Development optimizations
  devTools: {
    // Enable fast source maps in development
    sourcemap: true,
  },
  // Worker configuration
  worker: {
    format: 'es',
  },
}));
