'use client'

import * as React from 'react'
import { QuestionFieldsSchema, type Choice, type Question } from '@/lib/surveys'
import { createQuestionAction, updateQuestionAction } from '@/lib/surveys-query'
import { zodResolver } from '@hookform/resolvers/zod'
import slugify from '@sindresorhus/slugify'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormControl,
	FormDescription,
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

type FormSchemaType = z.infer<typeof QuestionFieldsSchema>

type QuestionCrudDialogProps = {
	surveyId: string
	question?: Question
	questions?: Question[]
	onSubmit: (question: Question) => void
	children: React.ReactNode
}

// Helper to get question text (handles both string and function)
const getQuestionText = (question: any): string => {
	if (typeof question === 'function') {
		return question({})
	}
	return question || 'Untitled Question'
}

export default function QuestionCrudDialog({
	surveyId,
	question,
	questions = [],
	onSubmit,
	children,
}: QuestionCrudDialogProps) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [choices, setChoices] = React.useState<Choice[]>(
		question?.fields?.choices || [],
	)
	const [hasDependency, setHasDependency] = React.useState(
		!!question?.fields?.dependsOn,
	)
	const [selectedParentQuestion, setSelectedParentQuestion] =
		React.useState<Question | null>(null)

	const form = useForm<FormSchemaType>({
		resolver: zodResolver(QuestionFieldsSchema),
		defaultValues: question?.fields || {
			slug: '',
			question: '',
			type: 'multiple-choice',
			choices: [],
			required: false,
			shuffleChoices: false,
			allowMultiple: false,
		},
	})

	const isSubmitting = form.formState.isSubmitting

	React.useEffect(() => {
		if (question?.fields) {
			form.reset(question.fields)
			setChoices(question.fields.choices || [])
			setHasDependency(!!question.fields.dependsOn)

			// Set selected parent question if dependency exists
			if (question.fields.dependsOn?.questionId) {
				const parentQ = questions.find(
					(q) => q.id === question.fields.dependsOn?.questionId,
				)
				setSelectedParentQuestion(parentQ || null)

				// Explicitly set both dependsOn form values
				form.setValue(
					'dependsOn.questionId',
					question.fields.dependsOn.questionId,
				)
				if (question.fields.dependsOn.answer) {
					form.setValue('dependsOn.answer', question.fields.dependsOn.answer)
				}
			}
		}
	}, [question, form, questions])

	// Set default parent question when toggling dependency on for new questions
	React.useEffect(() => {
		if (
			hasDependency &&
			!question &&
			!selectedParentQuestion &&
			questions.length > 0
		) {
			// Default to the last question in the list (previous question)
			const defaultParent = questions[questions.length - 1]
			if (defaultParent) {
				setSelectedParentQuestion(defaultParent)
			}
		}
	}, [hasDependency, question, selectedParentQuestion, questions])

	// Sync selectedParentQuestion with form value and clear answer when parent changes
	const prevParentRef = React.useRef<string | null>(null)
	React.useEffect(() => {
		const currentParentId = selectedParentQuestion?.id || null

		// Update form value to match selected parent
		if (currentParentId) {
			form.setValue('dependsOn.questionId', currentParentId)
		}

		// Clear answer when parent changes (since old answer might not be valid)
		if (prevParentRef.current && prevParentRef.current !== currentParentId) {
			form.setValue('dependsOn.answer', '')
		}

		prevParentRef.current = currentParentId
	}, [selectedParentQuestion, form])

	const questionType = form.watch('type')

	// Auto-generate slug from question text
	const questionText = form.watch('question')
	React.useEffect(() => {
		if (questionText && !question) {
			const autoSlug = slugify(questionText.slice(0, 50))
			form.setValue('slug', autoSlug)
		}
	}, [questionText, question, form])

	const handleAddChoice = () => {
		setChoices([...choices, { answer: '', label: '' }])
	}

	const handleRemoveChoice = (index: number) => {
		setChoices(choices.filter((_, i) => i !== index))
	}

	const handleChoiceChange = (
		index: number,
		field: 'answer' | 'label',
		value: string,
	) => {
		const updated = [...choices]
		const currentChoice = updated[index]
		if (currentChoice) {
			updated[index] = {
				answer: currentChoice.answer,
				label: currentChoice.label,
				image: currentChoice.image,
				[field]: value,
			}
		}
		setChoices(updated)
	}

	// Check for circular dependencies
	const checkCircularDependency = (
		currentQuestionId: string,
		targetQuestionId: string,
		visitedIds: Set<string> = new Set(),
	): boolean => {
		if (currentQuestionId === targetQuestionId) {
			return true
		}

		if (visitedIds.has(currentQuestionId)) {
			return false
		}

		visitedIds.add(currentQuestionId)

		const currentQuestion = questions.find((q) => q.id === currentQuestionId)
		if (!currentQuestion?.fields?.dependsOn?.questionId) {
			return false
		}

		return checkCircularDependency(
			currentQuestion.fields.dependsOn.questionId,
			targetQuestionId,
			visitedIds,
		)
	}

	// Validate dependency selection
	const getDependencyValidationMessage = (): {
		type: 'error' | 'warning'
		message: string
	} | null => {
		if (!hasDependency || !selectedParentQuestion) {
			return null
		}

		// Check for circular dependency (only for existing questions)
		if (
			question?.id &&
			checkCircularDependency(selectedParentQuestion.id, question.id)
		) {
			return {
				type: 'error',
				message:
					'Circular dependency detected! The parent question depends on this question.',
			}
		}

		// Check if parent comes after dependent in order (only for existing questions)
		if (question?.id) {
			const currentIndex = questions.findIndex((q) => q.id === question.id)
			const parentIndex = questions.findIndex(
				(q) => q.id === selectedParentQuestion.id,
			)

			if (
				currentIndex !== -1 &&
				parentIndex !== -1 &&
				parentIndex > currentIndex
			) {
				return {
					type: 'warning',
					message:
						'Parent question comes after this question in the survey order. Users may never see this question.',
				}
			}
		}

		return null
	}

	const dependencyValidation = getDependencyValidationMessage()

	const handleSubmit = async (values: FormSchemaType) => {
		// Prevent submission if there's a validation error
		if (dependencyValidation?.type === 'error') {
			return
		}

		try {
			// Validate dependency requirements
			if (hasDependency) {
				if (!values.dependsOn?.questionId) {
					form.setError('dependsOn.questionId', {
						type: 'manual',
						message: 'Parent question is required when dependency is enabled',
					})
					return
				}
				if (!values.dependsOn?.answer) {
					form.setError('dependsOn.answer', {
						type: 'manual',
						message: 'Answer value is required when dependency is enabled',
					})
					return
				}
			}

			// Include choices if it's a multiple-choice question
			const questionData = {
				...values,
				choices:
					values.type === 'multiple-choice' ||
					values.type === 'multiple-image-choice'
						? choices
						: undefined,
				// Only include dependsOn if dependency is enabled and all fields are present
				dependsOn:
					hasDependency &&
					values.dependsOn?.questionId &&
					values.dependsOn?.answer
						? {
								questionId: values.dependsOn.questionId,
								answer: values.dependsOn.answer,
							}
						: undefined,
			}

			let result
			if (question) {
				result = await updateQuestionAction({
					id: question.id,
					fields: questionData,
					surveyId,
				})
			} else {
				result = await createQuestionAction({
					surveyId,
					...questionData,
				})
			}

			if (result) {
				onSubmit(result as Question)
				setIsOpen(false)
				form.reset()
				setChoices([])
				setHasDependency(false)
				setSelectedParentQuestion(null)
			}
		} catch (error) {
			console.error('Failed to save question:', error)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle>
						{question ? 'Edit Question' : 'Add New Question'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="question"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Question Text</FormLabel>
									<FormControl>
										<Input placeholder="What is your question?" {...field} />
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
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="question-slug" {...field} />
									</FormControl>
									<FormDescription>
										Unique identifier used for storing answers
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Question Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="multiple-choice">
												Multiple Choice
											</SelectItem>
											<SelectItem value="essay">Essay</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3 rounded-lg border p-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="has-dependency"
									checked={hasDependency}
									onCheckedChange={(checked) => {
										setHasDependency(checked === true)
										if (!checked) {
											setSelectedParentQuestion(null)
											// Clear all dependsOn form values
											form.setValue('dependsOn.questionId', '' as any)
											form.setValue('dependsOn.answer', '' as any)
										}
									}}
								/>
								<label
									htmlFor="has-dependency"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									This question depends on another question
								</label>
							</div>

							{hasDependency && (
								<div className="space-y-3 pt-2">
									<div>
										<FormLabel>Parent Question</FormLabel>
										<Select
											value={selectedParentQuestion?.id || ''}
											onValueChange={(value) => {
												const parent = questions.find((q) => q.id === value)
												setSelectedParentQuestion(parent || null)
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a question" />
											</SelectTrigger>
											<SelectContent>
												{questions
													.filter((q) => q.id !== question?.id)
													.map((q) => (
														<SelectItem key={q.id} value={q.id}>
															{getQuestionText(q.fields?.question)}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>

									<FormField
										control={form.control}
										name="dependsOn.answer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Required Answer Value *</FormLabel>
												{selectedParentQuestion?.fields?.choices &&
												selectedParentQuestion.fields.choices.length > 0 ? (
													<Select
														onValueChange={field.onChange}
														value={field.value || ''}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select expected answer" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{selectedParentQuestion.fields.choices.map(
																(choice) => (
																	<SelectItem
																		key={choice.answer}
																		value={choice.answer}
																	>
																		{choice.label || choice.answer}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
												) : (
													<FormControl>
														<Input
															placeholder="Enter expected answer value"
															{...field}
															value={field.value || ''}
														/>
													</FormControl>
												)}
												<FormDescription>
													This question will only show if the parent question
													has this answer
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{dependencyValidation && (
										<div
											className={`rounded-md p-3 text-sm ${
												dependencyValidation.type === 'error'
													? 'bg-red-50 text-red-800'
													: 'bg-yellow-50 text-yellow-800'
											}`}
										>
											{dependencyValidation.message}
										</div>
									)}
								</div>
							)}
						</div>

						{(questionType === 'multiple-choice' ||
							questionType === 'multiple-image-choice') && (
							<div className="space-y-2">
								<FormLabel>Choices</FormLabel>
								<div className="space-y-2">
									{choices.map((choice, index) => (
										<div key={index} className="flex gap-2">
											<Input
												placeholder="Answer value"
												value={choice.answer}
												onChange={(e) =>
													handleChoiceChange(index, 'answer', e.target.value)
												}
											/>
											<Input
												placeholder="Label (optional)"
												value={choice.label || ''}
												onChange={(e) =>
													handleChoiceChange(index, 'label', e.target.value)
												}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleRemoveChoice(index)}
											>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</div>
									))}
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddChoice}
								>
									<Plus className="mr-2 h-4 w-4" /> Add Choice
								</Button>
							</div>
						)}

						<div className="space-y-3">
							<FormField
								control={form.control}
								name="required"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="!mt-0">Required</FormLabel>
									</FormItem>
								)}
							/>

							{(questionType === 'multiple-choice' ||
								questionType === 'multiple-image-choice') && (
								<>
									<FormField
										control={form.control}
										name="shuffleChoices"
										render={({ field }) => (
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<FormLabel className="!mt-0">Shuffle Choices</FormLabel>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="allowMultiple"
										render={({ field }) => (
											<FormItem className="flex items-center space-x-2 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<FormLabel className="!mt-0">
													Allow Multiple Selection
												</FormLabel>
											</FormItem>
										)}
									/>
								</>
							)}
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
							<Button
								type="submit"
								disabled={
									isSubmitting || dependencyValidation?.type === 'error'
								}
							>
								{isSubmitting ? 'Saving...' : question ? 'Update' : 'Create'}
							</Button>
						</div>
						<FormMessage />
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
