import tseslint from 'typescript-eslint'

/** @type {import("eslint").Linter.Config[]} */
export default [
	{
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
	{
		ignores: [
			'eslint.config.js',
			'node_modules/**',
			'.next/**',
			'out/**',
			'build/**',
			'next-env.d.ts',
			'.sanity/**',
			'dist/**',
			'coverage/**',
		],
	},
]
