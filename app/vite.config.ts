import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	// Other local apps hold 5173, 5187, 5193 and 5194 (Langclick's dev server and its browser tests).
	server: { port: 5195, strictPort: true },
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully static: no backend, and pages render in the browser only because
			// everything they show is read from local progress. 200.html is the
			// fallback a static host serves for any nested URL.
			adapter: adapter({ fallback: '200.html' })
		})
	],
	test: {
		expect: { requireAssertions: true },
		// A generous limit that still catches a real hang: the pre-push hook can run
		// beside other work on a loaded machine.
		testTimeout: 30_000,
		hookTimeout: 30_000,
		projects: [
			{
				// Component tests (`*.svelte.test.ts`) in a real headless Chromium.
				// One-time per machine: `npx playwright install chromium`.
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						// Windows can reserve Vitest's default port 63315. Keep the browser
						// API on loopback and let Vite try the next port if busy.
						api: { host: '127.0.0.1', port: 5196 },
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.ts'],
					exclude: ['src/**/*.svelte.{test,spec}.ts']
				}
			}
		]
	}
});
