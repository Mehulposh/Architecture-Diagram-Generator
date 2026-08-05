import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://architecture-diagram-generator-nq7t.onrender.com',
      '/socket.io': { target: 'https://architecture-diagram-generator-nq7t.onrender.com', ws: true },
    },
  },
});