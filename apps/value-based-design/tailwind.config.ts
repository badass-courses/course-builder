const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const { fontFamily } = require('tailwindcss/defaultTheme')

const { withUt } = require('uploadthing/tw')

const round = (num: number) =>
	num
		.toFixed(7)
		.replace(/(\.[0-9]+?)0+$/, '$1')
		.replace(/\.0$/, '')
const rem = (px: number) => `${round(px / 16)}rem`
const em = (px: number, base: number) => `${round(px / base)}em`

/** @type {import('tailwindcss').Config} */
module.exports = withUt({
	darkMode: ['class'],
	content: [
		'./src/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/ui/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/commerce-next/src/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/react-rsc/src/**/*.{ts,tsx}',
	],
	theme: {
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
			fontFamily: {
				sans: ['var(--font-geist-sans)', ...fontFamily.sans],
				mono: ['var(--font-geist-mono)', ...fontFamily.mono],
				serif: ['var(--font-fsBrabo)', ...fontFamily.serif],
			},
			colors: {
				gray: colors.stone,
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
				},
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
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
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
				spin: 'spin 2s linear infinite',
			},
			typography: (theme: any) => ({
				sm: {
					css: {
						fontSize: rem(18),
						lineHeight: round(24 / 18),
						'p, li, blockquote': {
							color: theme('colors.foreground'),
						},
						'h1, h2, h3, h4, h5, h6, strong': {
							color: theme('colors.foreground'),
						},
						'li::marker': {
							color: theme('colors.foreground'),
						},
						h1: {
							fontSize: em(32, 16),
							marginTop: '0',
							marginBottom: em(28, 36),
							lineHeight: round(32 / 36),
						},
						h2: {
							fontSize: em(22, 16),
							marginTop: em(32, 24),
							marginBottom: em(16, 24),
							lineHeight: round(26 / 24),
						},
						h3: {
							fontSize: em(18, 16),
							marginTop: em(28, 20),
							marginBottom: em(10, 20),
							lineHeight: round(28 / 20),
						},
						h4: {
							marginTop: em(16, 16),
							marginBottom: em(8, 16),
							lineHeight: round(24 / 16),
						},
						p: {
							marginTop: em(16, 18),
							marginBottom: em(16, 18),
						},
					},
				},
				DEFAULT: {
					css: {
						fontFamily: theme('fontFamily.serif').join(', '),
						fontSize: rem(22),
						lineHeight: round(32 / 22),
						'p, li, blockquote': {
							color: theme('colors.foreground'),
						},
						'h1, h2, h3, h4, h5, h6, strong': {
							color: theme('colors.foreground'),
						},
						'li::marker': {
							color: theme('colors.foreground'),
						},
						h1: {
							fontSize: em(36, 16),
							marginTop: '0',
							marginBottom: em(28, 36),
							lineHeight: round(34 / 36),
						},
						h2: {
							fontSize: em(24, 16),
							marginTop: em(32, 24),
							marginBottom: em(16, 24),
							lineHeight: round(26 / 24),
						},
						h3: {
							fontSize: em(20, 16),
							marginTop: em(28, 20),
							marginBottom: em(10, 20),
							lineHeight: round(28 / 20),
						},
						h4: {
							marginTop: em(24, 16),
							marginBottom: em(8, 16),
							lineHeight: round(24 / 16),
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
						p: {
							marginTop: em(20, 22),
							marginBottom: em(20, 22),
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
})
