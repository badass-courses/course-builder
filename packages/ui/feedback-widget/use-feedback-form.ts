import React from 'react'
import { usePathname } from 'next/navigation'

import { type FeedbackFormValues } from './feedback-schema'

export type SendFeedbackOptions = {
	feedbackText: string
	context?: {
		category: string
		emotion: string
		url: string
		location: string
	}
}

export const useFeedbackForm = ({
	location,
	sendFeedback,
}: {
	location: string
	sendFeedback: (options: SendFeedbackOptions) => Promise<void>
}) => {
	const pathname = usePathname()
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
			url: `${process.env.NEXT_PUBLIC_URL}${pathname}`,
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
