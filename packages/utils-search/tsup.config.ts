import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/typesense-adapter.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
