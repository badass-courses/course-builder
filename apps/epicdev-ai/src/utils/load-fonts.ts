import localFont from 'next/font/local'

export const vastagoGrotesk = localFont({
	preload: true,
	display: 'auto',
	variable: '--font-vastago-grotesk',
	src: [
		{
			path: '../styles/fonts/VastagoGrotesk-Thin.woff2',
			weight: '100',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-ExtraLight.woff2',
			weight: '200',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Light.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Medium.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-SemiBold.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Bold.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Heavy.woff2',
			weight: '800',
			style: 'normal',
		},
		{
			path: '../styles/fonts/VastagoGrotesk-Black.woff2',
			weight: '900',
			style: 'normal',
		},
	],
})
