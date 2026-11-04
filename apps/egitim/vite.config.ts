import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5234';
const proxyHeaders = process.env.VITE_API_PROXY_PROTO ? { 'X-Forwarded-Proto': process.env.VITE_API_PROXY_PROTO } : undefined;

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true, secure: false, headers: proxyHeaders },
      '/health': { target: proxyTarget, changeOrigin: true, secure: false, headers: proxyHeaders },
      '/hubs': { target: proxyTarget, ws: true, changeOrigin: true, secure: false },
      '/uploads': { target: proxyTarget, changeOrigin: true, secure: false },
    },
  },
}));
