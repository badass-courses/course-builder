import localFont from 'next/font/local'

export const gibson = localFont({
	preload: true,
	display: 'auto',
	variable: '--font-gibson',
	src: [
		{
			path: '../styles/fonts/canada-type-gibson_100_normal.woff2',
			weight: '100',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_100_italic.woff2',
			weight: '100',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_300_normal.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_300_italic.woff2',
			weight: '300',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_400_normal.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_400_italic.woff2',
			weight: '400',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_500_normal.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_500_italic.woff2',
			weight: '500',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_600_normal.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_600_italic.woff2',
			weight: '600',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_700_normal.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_700_italic.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/canada-type-gibson_900_normal.woff2',
			weight: '900',
			style: 'normal',
		},
		{
			path: '../styles/fonts/canada-type-gibson_900_italic.woff2',
			weight: '900',
			style: 'italic',
		},
	],
})
