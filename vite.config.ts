import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
	  hmr: {
		overlay: false // Disables the error overlay
	  }
	},
	optimizeDeps: {
	  exclude: ['problematic-package'] // Add any problematic modules here
	}
  });