'use client'

import { ConvertkitProvider } from '@/convertkit/use-convertkit'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ConvertkitProvider>
				<MDXProvider>{children}</MDXProvider>
			</ConvertkitProvider>
		</SessionProvider>
	)
}
