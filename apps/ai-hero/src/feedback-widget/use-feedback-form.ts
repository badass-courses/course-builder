import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { sendFeedbackFromUser } from '@/feedback-widget/feedback-actions'
import { FormikHelpers } from 'formik'

import { FeedbackFormValues } from './form'

export const useFeedbackForm = ({ location }: { location: string }) => {
	const pathname = usePathname()
	const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false)
	const [error, setError] = React.useState<string>()

	const submitFeedbackForm = React.useCallback(
		async (
			values: FeedbackFormValues,
			{ setSubmitting, resetForm }: FormikHelpers<FeedbackFormValues>,
		) => {
			setSubmitting(true)

			await sendFeedbackFromUser({
				feedbackText: values.text,
				context: values.context,
			})
				.then(() => {
					setIsSubmitted(true)
					resetForm()
				})
				.catch((error) => {
					setError(error.message)
					setIsSubmitted(true)
					resetForm()
				})
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
