'use client'

import { ConvertkitProvider } from '@/convertkit/use-convertkit'
import { MuxPlayerProvider } from '@/hooks/use-mux-player'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ConvertkitProvider>
				<MDXProvider>
					<MuxPlayerProvider>{children}</MuxPlayerProvider>
				</MDXProvider>
			</ConvertkitProvider>
		</SessionProvider>
	)
}
