'use client'

import * as React from 'react'
import {
	FeedbackProvider,
	useFeedback,
} from '@/feedback-widget/feedback-context'
import { MuxPlayerProvider } from '@/hooks/use-mux-player'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

import AmplitudeContextProvider from './amplitude-provider'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<AmplitudeContextProvider>
				<MDXProvider>
					<MuxPlayerProvider>
						<FeedbackProvider>{children}</FeedbackProvider>
					</MuxPlayerProvider>
				</MDXProvider>
			</AmplitudeContextProvider>
		</SessionProvider>
	)
}
