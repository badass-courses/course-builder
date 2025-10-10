import tseslint from 'typescript-eslint'

/** @type {import("eslint").Linter.Config[]} */
export default [
	{
		ignores: [
			'eslint.config.js',
			'**/*.config.js',
			'**/*.config.cjs',
			'node_modules/**',
			'.next/**',
			'out/**',
			'build/**',
			'next-env.d.ts',
			'.sanity/**',
			'dist/**',
			'coverage/**',
			'**/.well-known/**',
			'pnpm-lock.yaml',
		],
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true,
			},
		},
		rules: {
			// Keep it minimal - just the basic TypeScript parser setup
		},
	},
]
