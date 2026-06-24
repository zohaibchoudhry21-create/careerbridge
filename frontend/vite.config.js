import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        bypass(req) {
          // Frontend React route — must not proxy or backend redirects back here in a loop.
          if (req.url?.startsWith('/auth/social/callback')) {
            return '/index.html';
          }
        },
      },
    },
  },
});
