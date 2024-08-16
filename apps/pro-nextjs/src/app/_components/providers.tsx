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

function Feedback() {
	const { isFeedbackDialogOpen, feedbackComponent } = useFeedback()
	return <>{isFeedbackDialogOpen && feedbackComponent}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<FeedbackProvider>
			<Feedback />
			<AmplitudeContextProvider>
				<MDXProvider>
					<SessionProvider>
						<MuxPlayerProvider>{children}</MuxPlayerProvider>
					</SessionProvider>
				</MDXProvider>
			</AmplitudeContextProvider>
		</FeedbackProvider>
	)
}
