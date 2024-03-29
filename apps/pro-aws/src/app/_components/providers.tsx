'use client'

import * as React from 'react'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

import AmplitudeContextProvider from './amplitude-provider'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AmplitudeContextProvider>
			<MDXProvider>
				<SessionProvider>{children}</SessionProvider>
			</MDXProvider>
		</AmplitudeContextProvider>
	)
}
