import { cn } from '@/utils/cn'

import '@/styles/globals.css'

import { Providers } from './providers'

const PUBLIC_TITLE = 'Epic Web'

export const metadata = {
	title: {
		default: PUBLIC_TITLE,
		template: `%s | ${PUBLIC_TITLE}`,
	},
	description: 'The Epic Web Platform by Kent C. Dodds',
	openGraph: {
		title: PUBLIC_TITLE,
		description: 'The Epic Web Platform by Kent C. Dodds',
		url: process.env.NEXT_PUBLIC_URL,
		siteName: PUBLIC_TITLE,
		locale: 'en_US',
		type: 'website',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	twitter: {
		title: PUBLIC_TITLE,
		card: 'summary_large_image',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn('bg-background min-h-screen antialiased')}>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
