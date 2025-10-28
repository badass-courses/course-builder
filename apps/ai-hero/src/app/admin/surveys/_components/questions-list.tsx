'use client'

import * as React from 'react'
import type { Question } from '@/lib/surveys'
import {
	deleteQuestionAction,
	updateQuestionPositionsAction,
} from '@/lib/surveys-query'
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

import QuestionCrudDialog from './question-crud-dialog'

export function QuestionsList({
	surveyId,
	initialQuestions,
}: {
	surveyId: string
	initialQuestions: Question[]
}) {
	const [questions, setQuestions] = React.useState<Question[]>(initialQuestions)
	const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
		isOpen: boolean
		questionId: string | null
	}>({ isOpen: false, questionId: null })

	const handleCreate = (question: Question) => {
		setQuestions([...questions, question])
	}

	const handleUpdate = (updatedQuestion: Question) => {
		setQuestions(
			questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
		)
	}

	const handleDelete = async (questionId: string) => {
		try {
			await deleteQuestionAction({ questionId, surveyId })
			setQuestions(questions.filter((q) => q.id !== questionId))
			setDeleteConfirmation({ isOpen: false, questionId: null })
		} catch (error) {
			console.error('Failed to delete question:', error)
		}
	}

	/**
	 * Move a question up or down
	 */
	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const newIndex = direction === 'up' ? index - 1 : index + 1

		// Check bounds
		if (newIndex < 0 || newIndex >= questions.length) return

		// Swap positions
		const updatedQuestions = [...questions]
		const temp = updatedQuestions[index]
		const swapWith = updatedQuestions[newIndex]

		if (!temp || !swapWith) return

		updatedQuestions[index] = swapWith
		updatedQuestions[newIndex] = temp

		// Update local state
		setQuestions(updatedQuestions)

		// Update positions in the database
		try {
			await updateQuestionPositionsAction({
				surveyId,
				questions: updatedQuestions.map((q, idx) => ({
					questionId: q.id,
					position: idx,
				})),
			})
		} catch (error) {
			console.error('Failed to update question positions:', error)
			// Revert on error
			setQuestions(questions)
		}
	}

	// Helper to get question text (handles both string and function)
	const getQuestionText = (question: any): string => {
		if (typeof question === 'function') {
			return question({})
		}
		return question || 'Untitled Question'
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Survey Questions ({questions.length})</CardTitle>
				<QuestionCrudDialog
					surveyId={surveyId}
					questions={questions}
					onSubmit={handleCreate}
				>
					<Button variant="default" size="sm">
						<Plus className="mr-2 size-4" /> Add Question
					</Button>
				</QuestionCrudDialog>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{questions.length === 0 ? (
						<div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
							No questions yet. Add your first question to get started.
						</div>
					) : (
						<div className="space-y-2">
							{questions.map((question, index) => {
								const parentQuestion = question.fields?.dependsOn?.questionId
									? questions.find(
											(q) => q.id === question.fields.dependsOn?.questionId,
										)
									: null

								return (
									<div
										key={question.id}
										className="flex items-center gap-4 rounded-lg border p-4"
									>
										<div className="flex flex-col gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleMove(index, 'up')}
												disabled={index === 0}
												className="h-6 w-6 p-0"
											>
												<ArrowUp className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleMove(index, 'down')}
												disabled={index === questions.length - 1}
												className="h-6 w-6 p-0"
											>
												<ArrowDown className="h-3 w-3" />
											</Button>
										</div>
										<div className="flex-1">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<p className="font-medium">
														{typeof question.fields?.question === 'function'
															? getQuestionText(question.fields?.question)
															: question.fields?.question ||
																'Untitled Question'}
													</p>
													<div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
														<span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-500/20 dark:text-gray-200">
															{question.fields?.type}
														</span>
														<span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-500/20 dark:text-gray-200">
															Slug: {question.fields?.slug}
														</span>
														{question.fields?.required && (
															<span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">
																Required
															</span>
														)}
													</div>
													{parentQuestion && (
														<div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
															<ArrowRight className="size-4" />
															<span>
																Depends on:{' '}
																<span className="font-medium">
																	{typeof parentQuestion.fields?.question ===
																	'function'
																		? getQuestionText(
																				parentQuestion.fields?.question,
																			)
																		: parentQuestion.fields?.question ||
																			'Untitled Question'}
																</span>
																{' = '}
																<span className="rounded bg-purple-100 px-2 py-0.5 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200">
																	{question.fields.dependsOn?.answer}
																</span>
															</span>
														</div>
													)}
												</div>
												<div className="flex gap-2">
													<QuestionCrudDialog
														surveyId={surveyId}
														question={question}
														questions={questions}
														onSubmit={handleUpdate}
													>
														<Button variant="outline" size="icon">
															<Pencil className="size-4" />
														</Button>
													</QuestionCrudDialog>
													<Button
														variant="destructive"
														size="icon"
														onClick={() =>
															setDeleteConfirmation({
																isOpen: true,
																questionId: question.id,
															})
														}
													>
														<Trash2 className="size-4" />
													</Button>
												</div>
											</div>
											{question.fields?.choices &&
												question.fields.choices.length > 0 && (
													<div className="text-muted-foreground mt-2 text-sm">
														Choices: {question.fields.choices.length}
													</div>
												)}
										</div>
									</div>
								)
							})}
						</div>
					)}
					<Dialog
						open={deleteConfirmation.isOpen}
						onOpenChange={(isOpen) =>
							setDeleteConfirmation({ isOpen, questionId: null })
						}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Delete Question</DialogTitle>
								<DialogDescription>
									Are you sure you want to delete this question? This action
									cannot be undone.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogTrigger asChild>
									<Button variant="ghost">Cancel</Button>
								</DialogTrigger>
								<DialogTrigger asChild>
									<Button
										variant="destructive"
										onClick={() =>
											deleteConfirmation.questionId &&
											handleDelete(deleteConfirmation.questionId)
										}
									>
										Delete
									</Button>
								</DialogTrigger>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</CardContent>
		</Card>
	)
}
