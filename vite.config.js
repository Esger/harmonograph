import { defineConfig } from 'vite';

export default defineConfig({
  // If you are deploying to a custom domain or the root, use '/'
  // If you are deploying to GitHub Pages or a subdirectory, use '/repo-name/'
  base: './', 
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
  }
});
