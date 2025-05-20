'use client'

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
	buttonLabel = 'Create a new event',
	variant = 'default',
	className,
}: {
	buttonLabel?: string | React.ReactNode
	className?: string
	variant?: ButtonProps['variant']
}) {
	return (
		<div>
			<Dialog>
				<DialogTrigger asChild>
					<Button className={cn(className)} variant={variant}>
						{buttonLabel}
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create a new event</DialogTitle>
					</DialogHeader>
					<DialogDescription></DialogDescription>
					<CreateNewEventForm />
				</DialogContent>
			</Dialog>
		</div>
	)
}
