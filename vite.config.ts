import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works under any GitHub Pages subpath
  // (e.g. https://<user>.github.io/rust-and-rivets/) without hardcoding it.
  base: './',
  server: { port: 5173, open: true },
  build: { target: 'es2020', sourcemap: true }
});
