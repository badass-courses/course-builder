/// <reference types="vitest" />

import swc from 'unplugin-swc'
import { defineConfig } from 'vite'

export default defineConfig({
	test: {
		include: ['test/**/*.test.?(c|m)[jt]s?(x)'],
		coverage: {
			all: true,
			enabled: true,
			include: ['src'],
			reporter: ['json', 'html'],
		},
		setupFiles: ['../utils/vitest-setup.ts'],
	},
	plugins: [swc.vite()],
})
