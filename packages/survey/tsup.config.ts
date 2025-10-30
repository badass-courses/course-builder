import { defineConfig } from 'tsup'

export default defineConfig({
	entry: {
		index: 'src/index.tsx',
		types: 'src/types-entry.ts',
	},
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
