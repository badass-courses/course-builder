import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/get-unique-filename.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
