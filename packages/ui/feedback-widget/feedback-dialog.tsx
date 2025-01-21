'use client'

import * as React from 'react'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../primitives/dialog'
import { useFeedback } from './feedback-context'
import FeedbackForm from './feedback-form'

const Feedback = () => {
	const {
		isFeedbackDialogOpen,
		setIsFeedbackDialogOpen,
		location,
		sendFeedback,
	} = useFeedback()
	const handleCloseDialog = () => {
		setIsFeedbackDialogOpen(false, 'navigation')
	}
	return (
		<FeedbackDialog
			title="Tell us what you think!"
			isOpen={isFeedbackDialogOpen}
			handleCloseDialog={handleCloseDialog}
		>
			<FeedbackForm location={location} sendFeedback={sendFeedback} />
		</FeedbackDialog>
	)
}

type DialogProps = {
	handleCloseDialog: () => void
	isOpen: boolean
	title: string
}

const FeedbackDialog: React.FC<React.PropsWithChildren<DialogProps>> = ({
	handleCloseDialog,
	children,
	isOpen,
	title,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={handleCloseDialog}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	)
}

export default Feedback
