import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/cookies.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
