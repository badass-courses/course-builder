import * as React from 'react'
import { getImpersonatedSession } from '@/server/auth'

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
 * and passes it to LayoutClient for proper user menu display
 */
export default async function LayoutWithImpersonation({
	children,
	withContainer = false,
	className,
	highlightedResource,
}: Props) {
	const { session } = await getImpersonatedSession()

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
