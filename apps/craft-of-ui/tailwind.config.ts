import { color } from 'framer-motion'
import colors from 'tailwindcss/colors'
import defaultTheme from 'tailwindcss/defaultTheme'

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
			lineHeight: 1.2,
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
				gray: colors.slate,
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
				sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
				heading: ['var(--font-serif)', ...defaultTheme.fontFamily.serif],
				serif: ['var(--font-serif)', ...defaultTheme.fontFamily.serif],
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
				shine: {
					'0%': { 'background-position': '100%' },
					'100%': { 'background-position': '-100%' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				shine: 'shine 5s linear infinite',
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

						'ul > li': {
							color: theme('colors.foreground'),
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
				IDE: {
					css: {
						'*': {
							fontFamily: 'var(--font-geist-mono)',
							fontSize: '1rem',
							lineHeight: '1.75',
							marginBottom: '0',
							marginTop: '0',
							'@media (min-width: 640px)': {
								fontSize: '1rem',
							},
							'@media (max-width: 639px)': {
								fontSize: '0.875rem',
							},
						},

						ul: {
							margin: '1em 0 0 0',
							padding: '0 !important',
							listStylePosition: 'inside',
							listStyleType: '"✦ "',
						},
						'li::marker': {
							fontSize: '1em',
							color: theme('colors.foreground'),
						},
						'h1, h2, h3, h4': {
							marginTop: '2em',
						},
						'p::before': {
							content: '""',
							display: 'block',
							height: '1em',
						},
						'h1::before': {
							content: '"# "',
							opacity: 0.5,
						},
						'h2::before': {
							content: '"## "',
							opacity: 0.5,
						},
						'h3::before': {
							content: '"### "',
							opacity: 0.5,
						},
						'h4::before': {
							content: '"#### "',
							opacity: 0.5,
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
