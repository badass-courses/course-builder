import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/video-resource.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
