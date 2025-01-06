import { defineConfig } from 'vite'

export default defineConfig({
	optimizeDeps: {
		include: ['@coursebuilder/email-templates'],
	},
	build: {
		commonjsOptions: {
			include: [/email-templates/, /node_modules/],
		},
	},
})
