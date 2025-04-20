import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/build-etz-link.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
