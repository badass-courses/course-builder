import localFont from 'next/font/local'

export const cooperGoodtimeFont = localFont({
	variable: '--font-cooper-goodtime',
	display: 'block',
	src: [
		{
			path: '../styles/fonts/b2670822-b993-446a-972e-24a3f3bc33a2.woff2',
			weight: '400',
			style: 'normal',
		},
	],
})

export const cooperFont = localFont({
	variable: '--font-cooper',
	display: 'block',
	src: [
		{
			path: '../styles/fonts/55aa1177-351a-4d7d-8b6e-6e2964793b1a.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/685b603d-8aab-4904-9ee0-826d3db0c9cb.woff2',
			weight: '300',
			style: 'italic',
		},
		{
			path: '../styles/fonts/7bf405cd-a9a6-4978-af3d-eb7d223be03c.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/c5c9f8c2-ac9e-4b49-8c78-97d06cc3f650.woff2',
			weight: '500',
			style: 'italic',
		},
		{
			path: '../styles/fonts/fc2448d8-d15b-4d96-873c-403f1e841191.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/fda9d1f7-709d-4ca7-8e77-3b07c46e8cbf.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/1a7b93a5-9669-406c-84fc-ccf7b0a53d6e.woff2',
			weight: '900',
			style: 'normal',
		},
		{
			path: '../styles/fonts/ae43a21e-8e62-4e71-8bb0-c7aad4314c81.woff2',
			weight: '900',
			style: 'italic',
		},
	],
})
