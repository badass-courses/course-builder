'use client'

import * as React from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import Markdown from 'react-markdown'

/**
 * Displays attendee instructions for users who have purchased a ticket.
 * Only renders when instructions exist and user has purchased.
 */
export function AttendeeInstructions({
	attendeeInstructions,
	hasPurchased,
}: {
	attendeeInstructions: string | null | undefined
	hasPurchased: boolean
}) {
	if (!attendeeInstructions || !hasPurchased) {
		return null
	}

	return (
		<div className="dark:bg-card dark:border-foreground/10 mb-8 flex flex-col gap-1 rounded-md border bg-white p-6 text-left font-medium shadow-xl">
			<p className="inline-flex items-center font-semibold">
				<DocumentTextIcon className="mr-1 size-5 text-teal-600 dark:text-teal-400" />{' '}
				Attendee Instructions
			</p>
			<Markdown className="prose dark:prose-invert mt-2">
				{attendeeInstructions}
			</Markdown>
		</div>
	)
}
