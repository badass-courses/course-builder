import localFont from 'next/font/local'

export const l = localFont({
	preload: true,
	display: 'block',
	variable: '--font-l',
	src: [
		{
			path: '../styles/fonts/l_100_normal.woff2',
			weight: '100',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_100_italic.woff2',
			weight: '100',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_300_normal.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_300_italic.woff2',
			weight: '300',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_400_normal.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_400_italic.woff2',
			weight: '400',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_500_italic.woff2',
			weight: '500',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_700_normal.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_700_italic.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_800_normal.woff2',
			weight: '800',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_800_italic.woff2',
			weight: '800',
			style: 'italic',
		},
		{
			path: '../styles/fonts/l_900_normal.woff2',
			weight: '900',
			style: 'normal',
		},
		{
			path: '../styles/fonts/l_900_italic.woff2',
			weight: '900',
			style: 'italic',
		},
	],
})
