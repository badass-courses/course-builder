import React from 'react'

import {
	type FeedbackContext,
	type FeedbackFormValues,
} from './feedback-schema'

export type SendFeedbackOptions = {
	feedbackText: string
	context?: FeedbackContext
}

export const useFeedbackForm = ({
	location,
	sendFeedback,
	currentUrl,
}: {
	location: string
	sendFeedback: (options: SendFeedbackOptions) => Promise<void>
	currentUrl?: string
}) => {
	const [isSubmitted, setIsSubmitted] = React.useState(false)
	const [error, setError] = React.useState<string>()

	const submitFeedbackForm = React.useCallback(
		async (values: FeedbackFormValues) => {
			try {
				await sendFeedback({
					feedbackText: values.text,
					context: values.context,
				})
				setIsSubmitted(true)
			} catch (error) {
				setError(error instanceof Error ? error.message : 'An error occurred')
				setIsSubmitted(true)
			}
		},
		[sendFeedback],
	)

	const initialValues: FeedbackFormValues = {
		text: '',
		context: {
			category: 'general',
			emotion: ':wave:',
			url: currentUrl,
			location,
		},
	}

	return {
		initialValues,
		submitFeedbackForm,
		isSubmitted,
		error,
	}
}
