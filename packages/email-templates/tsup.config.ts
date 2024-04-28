import { execSync } from 'child_process'
import { defineConfig, Format } from 'tsup'

export const config = {
	sourcemap: true,
	dts: true,
	format: ['esm', 'cjs'] as Format[],
	entry: ['./emails/**/*.tsx'],
}

export default defineConfig(config)
