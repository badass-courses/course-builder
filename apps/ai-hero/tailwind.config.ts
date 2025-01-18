import { color } from 'framer-motion'
import colors from 'tailwindcss/colors'
import { fontFamily } from 'tailwindcss/defaultTheme'

// const { withUt } = require('uploadthing/tw')

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./src/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/chat-assistant/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/codemirror/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/hooks/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/primitives/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/feedback-widget/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/resources-crud/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/utils/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/index.tsx',
		'./node_modules/@coursebuilder/commerce-next/src/**/*.{ts,tsx}',
	],
	theme: {
		fluidTypography: {
			lineHeight: 1.1,
		},
		container: {
			center: true,
			padding: '1.5rem',
			screens: {
				'2xl': '1280px',
			},
		},
		extend: {
			screens: {
				'2xl': '1820px',
			},
			colors: {
				gray: colors.neutral,
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 2px)`,
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				sans: ['var(--font-maison-neue)', ...fontFamily.sans],
				heading: ['var(--font-meta)', ...fontFamily.sans],
				display: ['var(--font-quador)', ...fontFamily.sans],
				greek: ['var(--font-ceaser)', ...fontFamily.sans],
				mono: ['var(--font-maison-neue-mono)', ...fontFamily.mono],
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			typography: (theme: any) => ({
				DEFAULT: {
					css: {
						color: theme('colors.foreground'),
						th: {
							color: theme('colors.foreground'),
						},
						'tr, thead': {
							borderColor: theme('colors.border'),
						},
						p: { fontWeight: 400 },
						'h1, h2, h3, h4': {
							fontWeight: 700,
							color: theme('colors.foreground'),
						},
						ul: {
							listStylePosition: 'outside',
							listStyleImage:
								'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDEwIDEwIj4KICA8cGF0aCBzdHJva2U9IiNmZmYiIGQ9Ik0xLjE3IDIuNzg5IDUgLjU3NyA4LjgzIDIuNzl2NC40Mkw1IDkuNDIzIDEuMTcgNy4yMVYyLjc5WiIvPgo8L3N2Zz4K")',
						},
						'ul > li': {
							color: theme('colors.foreground'),
							'&::marker': {
								listStyleImage:
									'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDEwIDEwIj4KICA8cGF0aCBmaWxsPSIjRDlEOUQ5IiBkPSJtNSAwIDQuMzMgMi41djVMNSAxMCAuNjcgNy41di01TDUgMFoiLz4KPC9zdmc+Cg==")',
							},
						},
						blockquote: {
							borderLeftColor: theme('colors.muted.DEFAULT'),
							color: theme('colors.foreground'),
						},
						'ul, ol, li, strong': {
							color: theme('colors.foreground'),
						},
						a: {
							color: theme('colors.primary.DEFAULT'),
						},
						'code::before': {
							content: '""',
						},
						'code::after': {
							content: '""',
						},
						code: {
							backgroundColor: theme('colors.muted.DEFAULT'),
							color: theme('colors.foreground'),
							padding: '0.1rem 0.25rem',
							borderRadius: '0.25rem',
							whiteSpace: 'nowrap',
						},
						'pre code': {
							whiteSpace: 'pre-wrap',
						},
						pre: {
							border: `1px solid ${theme('colors.border')}`,
						},
					},
				},
			}),
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar'),
		require('tailwindcss-radix'),
		require('tailwindcss-animate'),
		require('tailwind-fluid-typography'),
	],
}
