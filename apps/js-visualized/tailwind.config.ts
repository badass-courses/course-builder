import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import { withUt } from 'uploadthing/tw'

const config: Config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx,mdx}',
		'./node_modules/@coursebuilder/ui/**/*.{ts,tsx}',
		'./node_modules/@coursebuilder/commerce-next/src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.25rem',
				md: '1.25rem',
				lg: '1.25rem',
				xl: '1.5rem',
				'2xl': '1.5rem',
			},
		},
		extend: {
			screens: {
				'2xl': '1440px',
			},
			fontFamily: {
				sans: ['var(--font-geist-sans)'],
			},
			colors: {
				'body-text': 'var(--jsv-misty-white)',
				'body-text-alt': 'var(--jsv-ghostly-white)',
				'jsv-misty-white': 'var(--jsv-misty-white)',
				'jsv-ghostly-white': 'var(--jsv-ghostly-white)',
				'jsv-green': 'rgb(from var(--jsv-green) r g b / <alpha-value>)',
				'jsv-blue': 'rgb(from var(--jsv-blue) r g b / <alpha-value>)',
				'jsv-blue-electric':
					'rgb(from var(--jsv-blue-electric) r g b / <alpha-value>)',
				'jsv-purple': 'rgb(from var(--jsv-purple) r g b / <alpha-value>)',
				'jsv-red': 'rgb(from var(--jsv-red) r g b / <alpha-value>)',
				'jsv-pink': 'rgb(from var(--jsv-pink) r g b / <alpha-value>)',
				'jsv-pink-hot': 'rgb(from var(--jsv-pink-hot) r g b / <alpha-value>)',
				'jsv-orange': 'rgb(from var(--jsv-orange) r g b / <alpha-value>)',
				'jsv-hazy-charcoal': 'var(--jsv-hazy-charcoal)',
				'jsv-charcoal': 'var(--jsv-charcoal)',
				'jsv-charcoal-black': 'var(--jsv-charcoal-black)',
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
				spin: 'spin 2s linear infinite',
			},
			backgroundImage: {
				'gradient-green-to-blue':
					'linear-gradient(134deg, var(--jsv-green) 40.75%, var(--jsv-blue) 90.52%)',
				'gradient-orange-to-pink':
					'linear-gradient(134deg, var(--jsv-orange) 5%, var(--jsv-pink) 90.52%)',
				'gradient-blue-to-pink':
					'linear-gradient(134deg, var(--jsv-blue-electric) 5%, var(--jsv-pink) 90.52%)',
				'gradient-pink-to-orange':
					'linear-gradient(134deg, var(--jsv-pink), var(--jsv-orange))',
				'gradient-button-hover':
					'linear-gradient(to right, #292B2C,#000,#292B2C,#292B2C,#000,#292B2C)',
			},
			typography: ({ theme }: { theme: any }) => ({
				DEFAULT: {
					css: {
						'--tw-prose-headings': 'var(--jsv-misty-white)',
						'--tw-prose-body': 'var(--jsv-ghostly-white)',
						lineHeight: '1.6',
						strong: {
							fontWeight: '700',
							color: 'white',
						},
						code: {
							color: 'white',
						},
					},
				},
			}),
		},
	},
	plugins: [
		plugin(({ addComponents }) => {
			addComponents({
				'.container': {
					maxWidth: '100%',
					'@screen 2xl': {
						maxWidth: '1328px',
					},
				},
			})
		}),
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar'),
		require('tailwindcss-radix'),
		require('tailwindcss-animate'),
	],
}

export default withUt(config)
