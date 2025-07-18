import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, XCircleIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button, Form, Textarea } from '../index'
import Spinner from '../primitives/spinner'
import { cn } from '../utils/cn'
import { useFeedback } from './feedback-context'
import { CategoryField, EmotionField } from './feedback-fields'
import { feedbackFormSchema, FeedbackFormValues } from './feedback-schema'
import { useFeedbackForm, type SendFeedbackOptions } from './use-feedback-form'

export const FeedbackForm: React.FC<{
	location: string
	sendFeedback: (options: SendFeedbackOptions) => Promise<void>
}> = ({ location, sendFeedback }) => {
	const { currentUrl } = useFeedback()
	const { initialValues, submitFeedbackForm, isSubmitted, error } =
		useFeedbackForm({ location, sendFeedback, currentUrl })
	const form = useForm<FeedbackFormValues>({
		resolver: zodResolver(feedbackFormSchema),
		defaultValues: initialValues,
	})

	const isCodeQuestion = form.watch('context.category') === 'code'

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(submitFeedbackForm)}
				className="flex flex-col space-y-5"
			>
				<div className={cn({ 'blur-xs pointer-events-none': isCodeQuestion })}>
					<Textarea
						{...form.register('text')}
						placeholder="Your feedback..."
						className="min-h-[150px]"
					/>
				</div>

				<div className="flex w-full flex-col space-y-5 md:flex-row md:space-x-10 md:space-y-0">
					<div
						className={cn({ 'blur-xs pointer-events-none': isCodeQuestion })}
					>
						<EmotionField control={form.control} />
					</div>
					<CategoryField control={form.control} />
				</div>

				{isCodeQuestion ? (
					<CodeQuestionMessage />
				) : (
					<SubmitButton isSubmitting={form.formState.isSubmitting}>
						Send feedback
					</SubmitButton>
				)}

				{isSubmitted && <ConfirmationMessage />}
				{error && <ErrorMessage>{error}</ErrorMessage>}
			</form>
		</Form>
	)
}

const CodeQuestionMessage = () => (
	<div className="pt-0.5 text-center">
		If you have any code related question or need help solving an exercise,{' '}
		<a
			className="text-primary font-medium hover:underline"
			href="/discord"
			target="_blank"
		>
			ask on my Discord server ↗︎
		</a>
	</div>
)

export const ErrorMessage: React.FC<React.PropsWithChildren<unknown>> = ({
	children,
}) => {
	return (
		<div
			aria-live="polite"
			className="bg-destructive text-destructive-foreground flex items-center justify-center rounded-md px-5 py-3 font-medium leading-tight"
		>
			<XCircleIcon className="mr-2 h-6 w-6" aria-hidden="true" /> Error:{' '}
			{children}
		</div>
	)
}

export const ConfirmationMessage = ({
	message = `Feedback sent, thank you!`,
	isModal = true,
}: {
	message?: string
	isModal?: boolean
}) => {
	const { setIsFeedbackDialogOpen } = useFeedback()
	return (
		<div
			aria-live="polite"
			className="bg-background text-foreground flex flex-wrap items-center justify-center rounded px-5 py-4 text-center text-sm font-semibold"
		>
			<CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" />{' '}
			<span>{message}</span>
			{isModal && (
				<button
					className="inline-block pl-2 underline"
					onClick={() => {
						setIsFeedbackDialogOpen(false)
					}}
				>
					Close
				</button>
			)}
		</div>
	)
}

type SubmitButtonProps = {
	isSubmitting: boolean
}

export const SubmitButton: React.FC<
	React.PropsWithChildren<SubmitButtonProps>
> = ({ isSubmitting, children }) => {
	return (
		<Button
			type="submit"
			size="lg"
			disabled={isSubmitting}
			className="bg-primary focus-visible:ring-ring text-primary-foreground focus:outline-hidden inline-flex items-center justify-center gap-1 rounded-lg border border-transparent px-4 py-3 text-base font-semibold leading-none transition focus-visible:ring-2 focus-visible:ring-offset-2"
		>
			{isSubmitting ? (
				<>
					<Spinner className="w-4" aria-hidden="true" /> Sending...
				</>
			) : (
				children
			)}
		</Button>
	)
}

export default FeedbackForm
