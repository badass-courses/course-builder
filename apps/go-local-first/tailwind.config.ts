import colors from 'tailwindcss/colors'
import defaultTheme, { fontFamily } from 'tailwindcss/defaultTheme'
import { withUt } from 'uploadthing/tw'

/** @type {import('tailwindcss').Config} */
export default withUt({
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
		fluidTypography: {},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '960px',
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
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				sans: ['var(--font-sans)', ...fontFamily.sans],
				heading: ['var(--gabarito)', ...fontFamily.sans],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			typography: (theme: any) => ({
				invert: {
					css: {
						a: {
							color: 'hsl(226 70% 65%)',
						},
					},
				},
				DEFAULT: {
					css: {
						color: theme('colors.foreground'),
						'li, strong, h1, h2, h3, h4, h5, h6': {
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
		require('tailwindcss-fluid-typography'),
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar'),
		require('tailwindcss-radix'),
		require('@designbycode/tailwindcss-text-stroke'),
	],
})
