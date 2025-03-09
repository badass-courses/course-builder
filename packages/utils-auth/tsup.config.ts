import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/current-ability-rules.ts'],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
