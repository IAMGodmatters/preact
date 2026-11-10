import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  // GitHub Pages serves this repository under /preact/.
  base: process.env.GITHUB_ACTIONS ? '/preact/' : '/',
});
