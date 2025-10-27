'use client'

import * as React from 'react'
import { createSurveyAction, updateSurveyAction } from '@/lib/surveys-actions'
import {
	DEFAULT_AFTER_COMPLETION_MESSAGES,
	SurveyFieldsSchema,
	type Survey,
	type SurveyWithQuestions,
} from '@/lib/surveys-schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

type FormSchemaType = z.infer<typeof SurveyFieldsSchema>

type SurveyCrudDialogProps = {
	survey?: Survey
	onSubmit: (survey: SurveyWithQuestions) => Promise<void>
	children: React.ReactNode
}

export default function SurveyCrudDialog({
	survey,
	onSubmit,
	children,
}: SurveyCrudDialogProps) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [isSubmitting, setIsSubmitting] = React.useState(false)

	const form = useForm<FormSchemaType>({
		resolver: zodResolver(SurveyFieldsSchema),
		defaultValues: survey?.fields || {
			title: '',
			slug: '',
			state: 'draft',
			visibility: 'unlisted',
			afterCompletionMessages: DEFAULT_AFTER_COMPLETION_MESSAGES,
		},
	})

	React.useEffect(() => {
		if (survey?.fields) {
			form.reset(survey.fields)
		}
	}, [survey, form])

	const handleSubmit = async (values: FormSchemaType) => {
		setIsSubmitting(true)
		try {
			let result
			if (survey) {
				result = await updateSurveyAction({
					id: survey.id,
					fields: values,
				})
			} else {
				result = await createSurveyAction({
					title: values.title,
					slug: values.slug,
					afterCompletionMessages: values.afterCompletionMessages,
				})
			}

			if (result) {
				await onSubmit(result)
				setIsOpen(false)
				form.reset()
			}
		} catch (error) {
			console.error('Failed to save survey:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{survey ? 'Edit Survey' : 'Create New Survey'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Survey Title" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug (optional)</FormLabel>
									<FormControl>
										<Input
											placeholder="survey-slug"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="state"
								render={({ field }) => (
									<FormItem>
										<FormLabel>State</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select state" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="draft">Draft</SelectItem>
												<SelectItem value="published">Published</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="visibility"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Visibility</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select visibility" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="public">Public</SelectItem>
												<SelectItem value="unlisted">Unlisted</SelectItem>
												<SelectItem value="private">Private</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-semibold">Completion Messages</h3>

							<div className="space-y-2">
								<FormField
									control={form.control}
									name="afterCompletionMessages.neutral.default"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Neutral - Default</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="afterCompletionMessages.neutral.last"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Neutral - Last Question</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="space-y-2">
								<FormField
									control={form.control}
									name="afterCompletionMessages.correct.default"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Correct - Default</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="afterCompletionMessages.correct.last"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Correct - Last Question</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="space-y-2">
								<FormField
									control={form.control}
									name="afterCompletionMessages.incorrect.default"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Incorrect - Default</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="afterCompletionMessages.incorrect.last"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Incorrect - Last Question</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : survey ? 'Update' : 'Create'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
