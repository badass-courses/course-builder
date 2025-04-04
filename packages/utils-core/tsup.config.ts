import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/guid.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
