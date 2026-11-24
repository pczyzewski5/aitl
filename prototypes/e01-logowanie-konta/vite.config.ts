import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const PREVIEW_PORT = 5180;
const prototypeRoot = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root: prototypeRoot,
  base: './',
  plugins: [tailwindcss()],
  oxc: { jsx: { runtime: 'automatic' } },
  server: { port: PREVIEW_PORT, strictPort: true, fs: { allow: [repositoryRoot] } },
  preview: { port: PREVIEW_PORT, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
