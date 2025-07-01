'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'

import { CreatePostModal } from '../../posts/_components/create-post-modal'
import CreateNewEventForm from './create-new-event-form'

export default function CreateNewEventDialog({
	buttonLabel = 'Create new event',
	variant = 'default',
	className,
}: {
	buttonLabel?: string | React.ReactNode
	className?: string
	variant?: ButtonProps['variant']
}) {
	const [open, setOpen] = React.useState(false)

	return (
		<div>
			<Dialog
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
						<DialogTitle className="text-xl font-bold">
							Create Event(s)
						</DialogTitle>
						<DialogDescription>
							Create one or multiple events that can be sold as a series. When
							creating multiple events, they will be grouped under one product
							for easier management.
						</DialogDescription>
					</DialogHeader>
					<CreateNewEventForm />
				</DialogContent>
			</Dialog>
		</div>
	)
}
