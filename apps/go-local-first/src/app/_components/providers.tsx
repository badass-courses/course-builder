'use client'

import * as React from 'react'
import { sendFeedbackFromUser } from '@/components/feedback-widget/feedback-actions'
import { MuxPlayerProvider } from '@/hooks/use-mux-player'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

import { FeedbackProvider } from '@coursebuilder/ui/feedback-widget'

import AmplitudeContextProvider from './amplitude-provider'

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<AmplitudeContextProvider>
				<MDXProvider>
					<MuxPlayerProvider>
						<FeedbackProvider sendFeedback={sendFeedbackFromUser}>
							{children}
						</FeedbackProvider>
					</MuxPlayerProvider>
				</MDXProvider>
			</AmplitudeContextProvider>
		</SessionProvider>
	)
}
