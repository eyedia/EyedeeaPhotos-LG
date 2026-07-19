import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // webOS Chromium often fails on Vite's modern type="module" bundles.
    // Legacy-only output avoids blank launches on Cloud Test Lab / older TVs.
    legacy({
      targets: ['Chrome >= 79'],
      renderModernChunks: false,
      modernPolyfills: false,
    }),
  ],
  base: './',
  server: {
    port: 5175,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
