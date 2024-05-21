import * as React from 'react'
import { api } from '@/trpc/react'

import type { NavLinkItem } from '../navigation/nav-link-item'

export function useNavLinks() {
	const { data: availableEvents, status } = api.events.get.useQuery()

	return [
		{
			href: '/tips',
			label: 'Tips',
		},
		{
			href: '/tutorials',
			label: 'Tutorials',
		},
		{
			href: '/events',
			label: (
				<>
					Events
					{availableEvents && availableEvents.length > 0 && (
						<div
							className="mb-1 ml-1 h-1 w-1 rounded-full bg-rose-400"
							aria-label={`${availableEvents.length} scheduled`}
						/>
					)}
				</>
			),
		},
		// {
		// 	href: '/articles',
		// 	label: 'Articles',
		// },
	] as NavLinkItem[]
}
