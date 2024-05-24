const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const { fontFamily } = require('tailwindcss/defaultTheme')

const { withUt } = require('uploadthing/tw')

/** @type {import('tailwindcss').Config} */
module.exports = withUt({
	darkMode: ['class'],
	content: [
		'./src/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/ui/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/commerce-next/src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: 0,
			screens: {
				'2xl': '1280px',
			},
		},
		extend: {
			fontFamily: {
				sans: ['var(--font-geist-sans)', ...fontFamily.sans],
				mono: ['var(--font-geist-mono)', ...fontFamily.mono],
				heading: ['var(--font-l)', ...fontFamily.sans],
			},
			colors: {
				gray: colors.trueGray,
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					body: 'hsl(var(--background-body))',
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
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar'),
		require('tailwindcss-radix'),
		require('tailwindcss-animate'),
	],
})
