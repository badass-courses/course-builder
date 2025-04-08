/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		setupFiles: ['./src/test/setup.ts'],
		environment: 'node',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
		globals: true,
	},
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			'@': '/src',
		},
	},
})
