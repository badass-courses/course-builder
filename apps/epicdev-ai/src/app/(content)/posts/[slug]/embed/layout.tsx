import { Metadata } from 'next'

export const metadata: Metadata = {
	robots: 'noindex, nofollow',
	other: {
		'X-Frame-Options': 'ALLOWALL',
		'Content-Security-Policy': 'frame-ancestors *;',
	},
}

export default function EmbedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<div
				style={{
					width: '100vw',
					height: '100vh',
					margin: 0,
					padding: 0,
					overflow: 'hidden',
					position: 'relative',
				}}
			>
				{children}
			</div>
		</>
	)
}
