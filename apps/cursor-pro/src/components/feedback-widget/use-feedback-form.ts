import React from 'react'
import { usePathname } from 'next/navigation'

import { type FeedbackFormValues } from '@coursebuilder/ui/feedback-widget'

import { sendFeedbackFromUser } from './feedback-actions'

export const useFeedbackForm = ({ location }: { location: string }) => {
	const pathname = usePathname()
	const [isSubmitted, setIsSubmitted] = React.useState(false)
	const [error, setError] = React.useState<string>()

	const submitFeedbackForm = React.useCallback(
		async (values: FeedbackFormValues) => {
			try {
				await sendFeedbackFromUser({
					feedbackText: values.text,
					context: values.context,
				})
				setIsSubmitted(true)
			} catch (error) {
				setError(error instanceof Error ? error.message : 'An error occurred')
				setIsSubmitted(true)
			}
		},
		[],
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
