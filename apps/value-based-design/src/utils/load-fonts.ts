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
