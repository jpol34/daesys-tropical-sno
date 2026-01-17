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
			reporter: ['text', 'html', 'lcov', 'json'],
			include: [
				'src/lib/services/**/*.ts',
				'src/lib/data/**/*.ts',
				'src/lib/utils/**/*.ts',
				'src/lib/actions/**/*.ts'
			],
			exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts', '**/index.ts'],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 70,
				statements: 80
			}
		}
	}
});
