const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const { fontFamily } = require('tailwindcss/defaultTheme')

const { withUt } = require('uploadthing/tw')

/** @type {import('tailwindcss').Config} */
module.exports = withUt({
	darkMode: ['class'],
	content: [
		'./src/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/chat-assistant/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/codemirror/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/hooks/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/primitives/**/*.{ts,tsx,mdx}',
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
			padding: '2rem',
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
					// DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
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
				heading: ['var(--font-heading)', ...fontFamily.sans],
				greek: ['var(--font-dalek)', ...fontFamily.sans],
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
						p: { fontWeight: 300 },
						'h1, h2, h3, h4': {
							fontWeight: 900,
							color: theme('colors.muted.foreground'),
						},
						'li, strong': {
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
							padding: '0.25rem',
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
		require('@designbycode/tailwindcss-text-stroke'),
		require('tailwind-fluid-typography'),
	],
})
