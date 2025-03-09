import { exec } from 'child_process'

export default function (plop) {
	// create your generators here
	plop.setGenerator('package-lib', {
		description: 'create a package lib',
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'package name please',
			},
		],
		actions: [
			{
				type: 'add',
				path: './packages/{{kebabCase name}}/package.json',
				templateFile: './plop-templates/package-lib/package.hbs',
			},
			{
				type: 'add',
				path: './packages/{{kebabCase name}}/tsup.config.ts',
				templateFile: './plop-templates/package-lib/tsup.config.hbs',
			},
			{
				type: 'add',
				path: './packages/{{kebabCase name}}/tsconfig.json',
				templateFile: './plop-templates/package-lib/tsconfig.hbs',
			},
			{
				type: 'add',
				path: './packages/{{kebabCase name}}/src/index.ts',
				templateFile: './plop-templates/package-lib/src/index.hbs',
			},
		],
	})

	plop.setGenerator('package-utils', {
		description:
			'create a utility package following the centralization pattern',
		// Usage examples:
		// pnpm plop package-utils browser cookies getCookies "Browser cookie utility"
		// pnpm plop package-utils -- --domain browser --utilityName cookies --functionName getCookies --utilityDescription "Browser cookie utility"
		prompts: [
			{
				type: 'input',
				name: 'domain',
				message: 'Utility domain (e.g., core, string, file, browser):',
			},
			{
				type: 'input',
				name: 'utilityName',
				message:
					'Utility file name (e.g., guid, cookies, get-unique-filename):',
			},
			{
				type: 'input',
				name: 'functionName',
				message:
					'Main function name (e.g., guid, getCookies, getUniqueFilename):',
			},
			{
				type: 'input',
				name: 'utilityDescription',
				message: 'Short description of the utility:',
			},
		],
		actions: [
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/package.json',
				templateFile: './plop-templates/package-utils/package.hbs',
			},
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/tsconfig.json',
				templateFile: './plop-templates/package-utils/tsconfig.hbs',
			},
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/tsup.config.ts',
				templateFile: './plop-templates/package-utils/tsup.config.hbs',
			},
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/vitest.config.ts',
				templateFile: './plop-templates/package-utils/vitest.config.hbs',
			},
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/src/{{kebabCase utilityName}}.ts',
				templateFile: './plop-templates/package-utils/src/utility.hbs',
			},
			{
				type: 'add',
				path: './packages/utils-{{kebabCase domain}}/src/{{kebabCase utilityName}}.test.ts',
				templateFile: './plop-templates/package-utils/src/test.hbs',
			},
		],
	})
}
