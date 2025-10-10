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
			'**/.eslintrc.cjs',
			'**/*.config.js',
			'**/*.config.cjs',
			'packages/config/**',
			'.next',
			'dist',
			'pnpm-lock.yaml',
		],
	},
]
