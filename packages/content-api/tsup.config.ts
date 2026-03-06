import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/**/*.ts', '!./src/**/__tests__/**'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
})
