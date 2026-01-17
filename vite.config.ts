import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/lib/services/**', 'src/lib/data/**'],
			exclude: ['**/*.test.ts', '**/*.spec.ts'],
			thresholds: {
				lines: 20,
				functions: 20,
				branches: 15,
				statements: 20
			}
		}
	}
});
