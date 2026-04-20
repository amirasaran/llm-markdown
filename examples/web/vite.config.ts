import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'flowdown/web': path.resolve(__dirname, '../../src/web/index.tsx'),
      'flowdown': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
