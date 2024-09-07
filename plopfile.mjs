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
}
