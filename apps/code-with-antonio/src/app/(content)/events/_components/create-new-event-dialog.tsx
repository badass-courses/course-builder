'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, createEventSeries } from '@/lib/events-query'
import { api } from '@/trpc/react'
import { z } from 'zod'

import {
	Button,
	CreateEventForm,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import { type EventCreationResult } from '@coursebuilder/ui/event-creation/create-event-form'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default function CreateNewEventDialog({
	buttonLabel = 'Create new event',
	variant = 'default',
	isOpen = false,
	className,
	modal = false,
}: {
	buttonLabel?: string | React.ReactNode
	className?: string
	variant?: ButtonProps['variant']
	isOpen?: boolean
	modal?: boolean
}) {
	const [open, setOpen] = React.useState(isOpen)
	const router = useRouter()
	const { data: tags } = api.tags.getTags.useQuery()
	const parsedTags = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags || [])

	const handleSuccess = async (result: EventCreationResult) => {
		if (result.type === 'single' && result.event) {
			router.push(getResourcePath('event', result.event.fields?.slug, 'edit'))
		} else if (result.type === 'series' && result.eventSeries) {
			router.push(
				getResourcePath('event', result.eventSeries.fields?.slug, 'edit'),
			)
		}
	}

	return (
		<div>
			<Dialog
				modal={modal}
				onOpenChange={(isOpen) => {
					setOpen(isOpen)
				}}
				open={open}
			>
				<DialogTrigger asChild>
					<Button className={cn(className)} variant={variant}>
						{buttonLabel}
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b pb-4">
						<DialogTitle className="text-xl font-semibold">
							Create Event(s)
						</DialogTitle>
						<DialogDescription>
							Create one or multiple events that can be sold as a series. When
							creating multiple events, they will be grouped under one product
							for easier management.
						</DialogDescription>
					</DialogHeader>
					<CreateEventForm
						tags={parsedTags}
						onSuccess={handleSuccess}
						createEvent={createEvent}
						createEventSeries={createEventSeries}
						allowMultipleEvents={true}
						allowCoupons={true}
						defaultTimezone="America/Los_Angeles"
						defaultPrice={250}
						defaultQuantity={40}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
