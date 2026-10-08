import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./app', import.meta.url)),
  publicDir: false,
  base: './',
  build: {
    outDir: fileURLToPath(new URL('./public', import.meta.url)),
    emptyOutDir: true,
  },
});
