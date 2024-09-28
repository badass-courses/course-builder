/** @type {import("eslint").Linter.Config} */
const config = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: true,
	},
	extends: ['next/core-web-vitals'],
	rules: {
		'react/no-unescaped-entities': 'off',
	},
}

module.exports = config
