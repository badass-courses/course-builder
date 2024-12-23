/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', '.next'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'.next/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/types/*',
			],
		},
	},
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'@': '/src',
		},
	},
})
