'use client'

import { MuxPlayerProvider } from '@/hooks/use-mux-player'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<MDXProvider>
			<SessionProvider>
				<MuxPlayerProvider>{children}</MuxPlayerProvider>
			</SessionProvider>
		</MDXProvider>
	)
}
