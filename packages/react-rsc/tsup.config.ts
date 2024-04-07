import { execSync } from 'child_process'
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/client.ts', 'src/index.ts'],
	sourcemap: 'inline',
	minify: true,
	clean: true,
	dts: true,
	format: ['cjs', 'esm'],
	external: ['react', 'react-dom'],
	injectStyle: false,
})
