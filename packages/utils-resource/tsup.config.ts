import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/filter-resources.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
