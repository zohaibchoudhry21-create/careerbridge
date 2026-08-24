import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG_PATH = path.resolve(__dirname, '../debug-cf8614.log');

function debugLogPlugin() {
  return {
    name: 'dbg-cf8614',
    configureServer(server) {
      server.middlewares.use('/__dbg/cf8614', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8') || '{}';
            fs.appendFileSync(DEBUG_LOG_PATH, `${raw}\n`, 'utf8');
          } catch {
            // ignore disk errors during debug
          }
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), debugLogPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/face-api.js')) {
            return 'face-api';
          }
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')
          ) {
            return 'three';
          }
          if (id.includes('node_modules/@vapi-ai')) {
            return 'vapi';
          }
        },
      },
    },
  },
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
