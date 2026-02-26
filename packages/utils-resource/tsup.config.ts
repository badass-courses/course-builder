import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/filter-resources.ts',
		'src/resource-paths.ts',
		'src/transform-workshop-result.ts',
	],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
})
