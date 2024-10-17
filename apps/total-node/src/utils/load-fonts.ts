import localFont from 'next/font/local'

export const callunaFont = localFont({
	preload: true,
	display: 'block',
	variable: '--font-calluna',
	src: [
		{
			path: '../styles/fonts/calluna_300_normal.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/calluna_600_normal.woff2',
			weight: '600',
			style: 'normal',
		},
		{
			path: '../styles/fonts/calluna_600_italic.woff2',
			weight: '600',
			style: 'italic',
		},
		{
			path: '../styles/fonts/calluna_700_normal.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../styles/fonts/calluna_700_italic.woff2',
			weight: '700',
			style: 'italic',
		},
		{
			path: '../styles/fonts/calluna_900_normal.woff2',
			weight: '900',
			style: 'normal',
		},
	],
})

export const dalekFont = localFont({
	preload: true,
	display: 'block',
	variable: '--font-dalek',
	src: [
		{
			path: '../styles/fonts/Dalek.woff2',
			weight: '400',
			style: 'normal',
		},
	],
})

export const headingFont = localFont({
	preload: true,
	display: 'block',
	variable: '--font-heading',
	src: [
		{
			path: '../styles/fonts/Heading-Light.woff2',
			weight: '300',
			style: 'normal',
		},
		{
			path: '../styles/fonts/Heading-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../styles/fonts/Heading-Medium.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../styles/fonts/Heading-Bold.woff2',
			weight: '700',
			style: 'normal',
		},
	],
})

export const maisonNeue = localFont({
	preload: true,
	display: 'block',
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

export const ffNortHeadline = localFont({
	src: [
		{
			path: '../styles/fonts/01014c8b-da7d-49ab-a0c3-76f7de7ba336.woff2',
			weight: '400',
			style: 'normal',
		},
	],
	variable: '--font-heading',
})

export const ffNort = localFont({
	preload: true,
	display: 'block',
	src: [
		{
			path: '../styles/fonts/a5f309ff-aa84-4aa6-9fd8-ca3feedb9265.woff2',
			weight: '300', // light
			style: 'normal',
		},
		{
			path: '../styles/fonts/44ae4887-8a35-45d6-b028-7516f3841c00.woff2',
			weight: '300', // light
			style: 'italic',
		},
		{
			path: '../styles/fonts/7b3ac33d-e084-4112-9256-a658b46fd6d2.woff2',
			weight: '400', // regular
			style: 'normal',
		},
		{
			path: '../styles/fonts/e905a5b7-87ed-4c15-9f2b-5be5f7f61a2a.woff2',
			weight: '400', // regular
			style: 'italic',
		},
		{
			path: '../styles/fonts/034a240e-f841-4345-959f-cf75a47c0116.woff2',
			weight: '500', // medium
			style: 'normal',
		},
		{
			path: '../styles/fonts/e446908b-705f-4bf8-8d3a-ad71a1ceebdf.woff2',
			weight: '500', // medium
			style: 'italic',
		},
		{
			path: '../styles/fonts/42c249a8-2cd5-4153-bc57-d3b48f1ea489.woff2',
			weight: '600', // bold
			style: 'normal',
		},
		{
			path: '../styles/fonts/f7ead13e-b410-4a9d-9c46-5b748bf9684f.woff2',
			weight: '600', // bold
			style: 'italic',
		},
		{
			path: '../styles/fonts/5a128de3-9adf-4965-9593-eb12c999db47.woff2',
			weight: '700', // black
			style: 'normal',
		},
		{
			path: '../styles/fonts/9126e06d-5332-4336-9419-4ba4b0e23796.woff2',
			weight: '700', // black
			style: 'italic',
		},
	],
	variable: '--font-sans',
})
