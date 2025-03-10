import localFont from 'next/font/local'

export const maisonNeue = localFont({
	preload: true,
	display: 'auto',
	src: [
		{
			path: '../styles/fonts/79b83604-3201-4a23-bd15-e067b7bcd7f0.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/ef4b8336-0cf9-4539-a8cc-df8dae48544e.woff2',
			weight: '300',
			style: 'italic',
		},
		{
			path: '../styles/fonts/315bef49-c1fe-41b3-8818-d8bf3f419ec0.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/8827affc-28d7-48e8-a9bf-a6813708ffce.woff2',
			weight: '400',
			style: 'italic',
		},
		{
			path: '../styles/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/c8ba4ebf-0c55-4ef5-ab77-2af3b3e36100.woff2',
			weight: '500',
			style: 'italic',
		},
		{
			path: '../styles/fonts/a8455863-362b-408b-9e87-abf87d85cc02.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/68610dd5-3d11-4fac-b816-14bad639bf35.woff2',
			weight: '600',
			style: 'italic',
		},
		{
			path: '../styles/fonts/2ab3ff52-7485-4c28-9be2-8f3808fd0d1e.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/9c6ef99a-960c-44b0-8141-7839f52c839b.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/83788dbe-ee5f-4e59-956a-ee247130ce60.woff2',
			weight: '800',
			style: 'normal',
		},
		{
			path: '../styles/fonts/84e00d34-b530-47f7-8b5e-e32d58ad0fa2.woff2',
			weight: '800',
			style: 'italic',
		},
	],
	variable: '--font-maison-neue',
})

export const maisonNeueMono = localFont({
	src: [
		{
			path: '../styles/fonts/04338221-4ea2-466d-adb2-18c482ed6495.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/70d999f2-1a4f-4942-b964-835a1f6de901.woff2',
			weight: '400',
			style: 'italic',
		},
		{
			path: '../styles/fonts/5f329838-170e-444a-abcd-54a253d184a3.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/b0b86274-062f-4f12-9363-7da4db047af5.woff2',
			weight: '500',
			style: 'italic',
		},
	],
	variable: '--font-maison-neue-mono',
})
