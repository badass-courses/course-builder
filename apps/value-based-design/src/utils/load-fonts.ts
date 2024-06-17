import localFont from 'next/font/local'

export const yrsa = localFont({
	preload: true,
	display: 'auto', // 'block' | 'swap' | 'fallback' | 'optional'
	variable: '--font-yrsa',
	src: [
		{
			path: '../styles/fonts/yrsa_300_normal.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/yrsa_400_normal.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/yrsa_500_normal.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/yrsa_600_normal.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/yrsa_700_normal.woff2',
			weight: '700',
			style: 'normal',
		},
	],
})

export const fsBraboWeb = localFont({
	preload: true,
	display: 'auto', // 'block' | 'swap' | 'fallback' | 'optional'
	variable: '--font-fsBrabo',
	src: [
		{
			path: '../styles/fonts/FSBraboWeb-Bold.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-BoldItalic.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/FSBraboWeb-ExtraLt.woff2',
			weight: '200',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-ExtraLtItalic.woff2',
			weight: '200',
			style: 'italic',
		},
		{
			path: '../styles/fonts/FSBraboWeb-Italic.woff2',
			weight: '400',
			style: 'italic',
		},
		{
			path: '../styles/fonts/FSBraboWeb-Light.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-LightItalic.woff2',
			weight: '300',
			style: 'italic',
		},
		{
			path: '../styles/fonts/FSBraboWeb-Medium.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-MediumItalic.woff2',
			weight: '500',
			style: 'italic',
		},
		{
			path: '../styles/fonts/FSBraboWeb-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-SemiBd.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/FSBraboWeb-SemiBdItalic.woff2',
			weight: '600',
			style: 'italic',
		},
	],
})
