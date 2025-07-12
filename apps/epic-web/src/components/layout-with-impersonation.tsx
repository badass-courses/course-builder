import * as React from 'react'
import { getImpersonatedSession } from '@/server/auth'
import { log } from '@/server/logger'

import LayoutClient from './layout-client'

type Props = {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	highlightedResource?: {
		path: string
		title: string
	}
}

/**
 * Server component wrapper that fetches impersonated session data
 * and passes it to LayoutClient for proper user menu display.
 * Handles session retrieval errors gracefully with fallback behavior.
 */
export default async function LayoutWithImpersonation({
	children,
	withContainer = false,
	className,
	highlightedResource,
}: Props) {
	let session = null

	try {
		const result = await getImpersonatedSession()
		session = result.session
	} catch (error) {
		log.error('Failed to retrieve impersonated session', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		// Fallback to null session - layout will handle unauthenticated state
		session = null
	}

	return (
		<LayoutClient
			withContainer={withContainer}
			className={className}
			highlightedResource={highlightedResource}
			user={session?.user}
		>
			{children}
		</LayoutClient>
	)
}
