'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { sendFeedbackFromUser } from '@/components/feedback-widget/feedback-actions'
import { MuxPlayerProvider } from '@/hooks/use-mux-player'
import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

import { FeedbackProvider } from '@coursebuilder/ui/feedback-widget'

import AmplitudeContextProvider from './amplitude-provider'

export function Providers({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const currentUrl = `${process.env.NEXT_PUBLIC_URL}${pathname}`

	return (
		<SessionProvider>
			<AmplitudeContextProvider>
				<MDXProvider>
					<MuxPlayerProvider>
						<FeedbackProvider
							sendFeedback={sendFeedbackFromUser}
							currentUrl={currentUrl}
						>
							{children}
						</FeedbackProvider>
					</MuxPlayerProvider>
				</MDXProvider>
			</AmplitudeContextProvider>
		</SessionProvider>
	)
}
