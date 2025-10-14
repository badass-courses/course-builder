import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import isaacscriptPlugin from 'eslint-plugin-isaacscript'
import prettierPlugin from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import("eslint").Linter.Config[]} */
export default [
	// Ignore patterns
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'.turbo/**',
			'eslint.config.js',
			'*.config.{js,mjs,cjs}',
		],
	},

	// Apply type-checked configs to TypeScript files
	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: ['**/*.{ts,tsx}'],
	})),
	...tseslint.configs.stylisticTypeChecked.map((config) => ({
		...config,
		files: ['**/*.{ts,tsx}'],
	})),

	// Main config for TypeScript files
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			import: importPlugin,
			isaacscript: isaacscriptPlugin,
			prettier: prettierPlugin,
		},
		rules: {
			// Prettier integration
			...prettierConfig.rules,
			'prettier/prettier': 'error',

			// These off/not-configured-the-way-we-like lint rules we like & opt into
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/consistent-type-definitions': 'off',
			'turbo/no-undeclared-env-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'inline-type-imports' },
			],
			'import/consistent-type-specifier-style': ['error', 'prefer-inline'],

			// For educational purposes we format our comments/jsdoc nicely
			'isaacscript/complete-sentences-jsdoc': 'warn',
			'isaacscript/format-jsdoc-comments': 'warn',

			// These lint rules don't make sense for us but are enabled in the preset configs
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/consistent-indexed-object-style': 'off',
			'@typescript-eslint/prefer-promise-reject-errors': 'off',

			// This rule doesn't seem to be working properly
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
		},
	},

	// Template files don't have reliable type information
	{
		files: ['template/**/*.{ts,tsx}'],
		...tseslint.configs.disableTypeChecked,
	},
]
