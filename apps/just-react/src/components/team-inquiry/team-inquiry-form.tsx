'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, XCircleIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
	Button,
	Form,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@coursebuilder/ui'
import Spinner from '@coursebuilder/ui/primitives/spinner'

import { sendTeamInquiry } from './team-inquiry-actions'
import {
	teamInquirySchema,
	type TeamInquiryFormValues,
} from './team-inquiry-schema'

const SuccessMessage = ({ message }: { message: string }) => (
	<div
		aria-live="polite"
		className="bg-background text-foreground flex flex-wrap items-center justify-center rounded px-5 py-4 text-center text-sm font-semibold"
	>
		<CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" />{' '}
		<span>{message}</span>
	</div>
)

const ErrorMessage = ({ children }: React.PropsWithChildren) => (
	<div
		aria-live="polite"
		className="bg-destructive text-destructive-foreground flex items-center justify-center rounded-md px-5 py-3 font-medium leading-tight"
	>
		<XCircleIcon className="mr-2 h-6 w-6" aria-hidden="true" /> Error:{' '}
		{children}
	</div>
)

export const TeamInquiryForm: React.FC<{ location: string }> = ({
	location,
}) => {
	const [isSubmitted, setIsSubmitted] = React.useState(false)
	const [error, setError] = React.useState<string>()

	const form = useForm<TeamInquiryFormValues>({
		resolver: zodResolver(teamInquirySchema),
		defaultValues: {
			name: '',
			email: '',
			companyName: '',
			teamSize: '1-10',
			message: '',
			website: '',
			timestamp: new Date().toISOString(),
		},
	})

	const onSubmit = async (values: TeamInquiryFormValues) => {
		// Check if submission is too fast (less than 3 seconds)
		const submissionTime = new Date()
		const startTime = new Date(values.timestamp)
		const timeDiff = submissionTime.getTime() - startTime.getTime()

		if (timeDiff < 3000) {
			setError('Please try again')
			return
		}

		const result = await sendTeamInquiry({
			...values,
			context: {
				url: location,
			},
		})

		if (result.error) {
			setError(result.error)
		} else {
			setIsSubmitted(true)
			form.reset({
				...form.formState.defaultValues,
				timestamp: new Date().toISOString(),
			})
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col space-y-5"
			>
				<input type="hidden" {...form.register('timestamp')} />

				{/* Honeypot field - visually hidden but available to bots */}
				<div className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0">
					<Label htmlFor="website">Website</Label>
					<Input
						{...form.register('website')}
						id="website"
						type="text"
						tabIndex={-1}
					/>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input {...form.register('name')} id="name" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input {...form.register('email')} id="email" type="email" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="companyName">Company Name</Label>
						<Input {...form.register('companyName')} id="companyName" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="teamSize">Team Size</Label>
						<Select
							onValueChange={(value) =>
								form.setValue(
									'teamSize',
									value as TeamInquiryFormValues['teamSize'],
								)
							}
							value={form.watch('teamSize')}
						>
							<SelectTrigger id="teamSize">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1-10">1-10 employees</SelectItem>
								<SelectItem value="11-50">11-50 employees</SelectItem>
								<SelectItem value="51-200">51-200 employees</SelectItem>
								<SelectItem value="201+">201+ employees</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="message">Message (Optional)</Label>
					<Textarea
						{...form.register('message')}
						id="message"
						placeholder="Tell us about your team and what you're looking to achieve..."
						className="min-h-[100px]"
					/>
				</div>

				<Button
					type="submit"
					size="lg"
					disabled={form.formState.isSubmitting}
					className="w-full"
				>
					{form.formState.isSubmitting ? (
						<>
							<Spinner className="w-4" aria-hidden="true" /> Sending...
						</>
					) : (
						'Get in Touch'
					)}
				</Button>

				{isSubmitted && (
					<SuccessMessage message="Thanks for your interest! We'll be in touch soon." />
				)}
				{error && <ErrorMessage>{error}</ErrorMessage>}
			</form>
		</Form>
	)
}
