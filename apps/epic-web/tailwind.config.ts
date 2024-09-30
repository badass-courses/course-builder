const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const { withUt } = require('uploadthing/tw')

/** @type {import('tailwindcss').Config} */
module.exports = withUt({
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/ui/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/commerce-next/src/**/*.{ts,tsx}',
	],
	theme: {
		fluidTypography: {},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				sans: ['var(--font-dmsans)', ...defaultTheme.fontFamily.sans],
				mono: ['var(--font-jetbrainsmono)', ...defaultTheme.fontFamily.mono],
				orig: defaultTheme.fontFamily.sans,
			},
			colors: {
				brand: 'hsl(var(--primary))',
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
				gray: {
					...colors.gray,
					950: '#080B16',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				heartbeat: 'heartbeat 1s linear infinite',
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
				heartbeat: {
					'10%': {
						transform: 'scale(1.1)',
					},
				},
			},
			screens: {
				'2xl': '1820px',
			},
			boxShadow: {
				'soft-xxs': '0 1px 5px 1px #ddd',
				'soft-xs':
					'0 3px 5px -1px rgba(0,0,0,.09),0 2px 3px -1px rgba(0,0,0,.07)',
				'soft-sm':
					'0 .25rem .375rem -.0625rem hsla(0,0%,8%,.12),0 .125rem .25rem -.0625rem hsla(0,0%,8%,.07)',
				'soft-md':
					'0 4px 7px -1px rgba(0,0,0,.11),0 2px 4px -1px rgba(0,0,0,.07)',
				'soft-lg': '0 2px 12px 0 rgba(0,0,0,.16)',
				'soft-xl': '0 20px 27px 0 rgba(0,0,0,.05)',
				'soft-2xl': '0 .3125rem .625rem 0 rgba(0,0,0,.12)',
				'soft-3xl':
					'0 8px 26px -4px hsla(0,0%,8%,.15),0 8px 9px -5px hsla(0,0%,8%,.06)',
			},
			typography: (theme: any) => ({
				DEFAULT: {
					css: {
						img: {
							borderRadius: theme('borderRadius.md'),
						},
						color: theme('colors.gray.800'),
						'h1, h2, h3, h4, blockquote': {
							color: theme('colors.gray.900'),
						},
						'code::before': {
							content: "''",
						},
						'code::after': {
							content: "''",
						},
						a: {
							color: theme('colors.primary.DEFAULT'),
							textDecoration: 'none',
						},
						'a:hover': {
							textDecoration: 'underline',
						},
						code: {
							fontSize: theme('fontSize.sm'),
							padding: theme('spacing.1'),
							borderRadius: theme('borderRadius.sm'),
							color: theme('colors.gray.800'),
							backgroundColor: theme('colors.gray.200'),
						},
					},
				},
				invert: {
					css: {
						color: theme('colors.gray.200'),
						'h1, h2, h3, h4, blockquote': {
							color: theme('colors.gray.100'),
						},
						a: {
							color: '#86A0FF',
						},
						code: {
							color: theme('colors.gray.200'),
							backgroundColor: theme('colors.gray.800'),
						},
					},
				},
			}),
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwind-fluid-typography'),
		require('tailwind-scrollbar'),
		require('tailwindcss-animate'),
	],
})
