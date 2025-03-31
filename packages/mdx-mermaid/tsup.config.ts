import { defineConfig, Format } from 'tsup'

// Client-side config
const clientConfig = {
	entry: ['src/client.tsx'],
	format: ['esm'] as Format[],
	dts: true,
	external: ['react'],
	esbuildOptions(options) {
		options.jsx = 'automatic'
	},
}

// Server-side config
const serverConfig = {
	entry: ['src/remarkPlugin.ts'],
	format: ['esm'] as Format[],
	dts: true,
	external: ['unified', 'unist-util-visit'],
}

export default defineConfig([clientConfig, serverConfig])
