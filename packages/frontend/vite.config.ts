import path from 'node:path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // Bundle analyzer plugin for development and analyze modes
      mode === 'analyze' &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/app': path.resolve(__dirname, './src/app'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/design-system': path.resolve(__dirname, './src/design-system'),
      },
    },

    // Performance optimizations
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode === 'development',

      // Code splitting configuration
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['antd'],
            flow: ['reactflow'],
            store: ['zustand'],
            utils: ['lodash', 'axios'],
          },
        },
      },

      // Warn for chunks larger than 500KB
      chunkSizeWarningLimit: 500,

      // Enable/disable compression based on environment
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4KB
    },

    // Development server configuration
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT, 10) || 3000,
      host: env.VITE_DEV_SERVER_HOST || true,
      open: true,
      cors: true,

      // HMR configuration
      hmr: {
        port: parseInt(env.VITE_HMR_PORT, 10) || 24678,
        host: env.VITE_HMR_HOST || 'localhost',
      },
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: 'localhost',
      open: true,
    },

    // Environment variables configuration
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd', 'reactflow', 'zustand', 'axios'],
    },
  };
});
