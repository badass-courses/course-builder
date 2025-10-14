import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			react,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			globals: {
				...globals.browser,
				React: 'writable',
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off', // Not needed with React 17+
			// Disable aggressive React Compiler rules
			'react-hooks/static-components': 'off',
			'react-hooks/refs': 'off',
			'react-hooks/immutability': 'off',
			'react-hooks/preserve-manual-memoization': 'off',
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/incompatible-library': 'off',
			'react-hooks/use-memo': 'off',
			// Turn error-level rules into warnings or off to match previous behavior
			'react/no-unknown-property': 'warn',
			'react/no-unescaped-entities': 'off',
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
]
