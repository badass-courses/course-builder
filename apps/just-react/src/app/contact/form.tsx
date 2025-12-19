'use client'

import type { User } from '@/ability'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'

import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'

import { submitFeedbackForm } from './actions'

export default function ContactForm({ user }: { user?: User | null }) {
	const form = useForm<{
		text: string
		email: string
	}>({
		resolver: zodResolver(
			z.object({
				text: z.string().min(1),
				email: z
					.string()
					.email()
					.default(user?.email || ''),
			}),
		),
	})

	return (
		<div className="bg-card border-border rounded-lg border p-6 shadow-md">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((values) =>
						submitFeedbackForm(values, form).then(() => {
							form.reset({
								text: '',
							})
						}),
					)}
					className="space-y-4"
				>
					<FormField
						control={form.control}
						name="text"
						render={({ field }) => (
							<FormItem className="flex flex-col gap-1">
								<FormLabel>
									Message
									<abbr className="no-underline" title="required">
										*
									</abbr>
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Your message..."
										className="bg-input border-border min-h-[150px] border"
										cols={5}
									/>
								</FormControl>
								<FormMessage>{form.formState.errors.text?.message}</FormMessage>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="flex flex-col gap-1">
								<FormLabel>
									Email
									<abbr className="no-underline" title="required">
										*
									</abbr>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										defaultValue={user?.email || ''}
										disabled={!!user?.email}
										placeholder="Your email"
										className="bg-input border-border border"
										type="email"
									/>
								</FormControl>
								<FormMessage>
									{form.formState.errors.email?.message}
								</FormMessage>
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
					</Button>
					{form.formState.isSubmitSuccessful && (
						<Alert variant={'default'}>
							<AlertTitle>Success</AlertTitle>
							<AlertDescription>
								Your message has been sent. We'll get back to you as soon as
								possible.
							</AlertDescription>
						</Alert>
					)}
				</form>
			</Form>
		</div>
	)
}
