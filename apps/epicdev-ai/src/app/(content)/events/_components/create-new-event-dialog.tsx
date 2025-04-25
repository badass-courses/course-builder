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

import { CreatePostModal } from '../../posts/_components/create-post-modal'
import CreateNewEventForm from './create-new-event-form'

export default function CreateNewEventDialog() {
	return (
		<div>
			<Dialog>
				<DialogTrigger asChild>
					<Button>Create a new event</Button>
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
