import baseConfig from '@coursebuilder/eslint-config/base.js'
import nextConfig from '@coursebuilder/eslint-config/nextjs.js'
import reactConfig from '@coursebuilder/eslint-config/react.js'

/** @type {import("eslint").Linter.Config[]} */
export default [
	...baseConfig,
	...reactConfig,
	...nextConfig,
	{
		// App-specific overrides
		rules: {},
	},
]
