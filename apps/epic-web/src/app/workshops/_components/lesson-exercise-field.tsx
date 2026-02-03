'use client'

import { useRef, useState } from 'react'
import Spinner from '@/components/spinner'
import { Lesson, type LessonSchema } from '@/lib/lessons'
import { api } from '@/trpc/react'
import { Pencil, Plus, Trash } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	useToast,
} from '@coursebuilder/ui'

export default function LessonExerciseField({
	form,
	lesson,
}: {
	form: UseFormReturn<z.infer<typeof LessonSchema>>
	lesson: Lesson
}) {
	const { toast } = useToast()
	const { data: exercises, refetch: refetchExercises } =
		api.exercises.getResourceExercises.useQuery({
			resourceId: lesson.id,
		})
	const { mutate: createExercise, status: createExerciseStatus } =
		api.exercises.createAndAttachExerciseToResource.useMutation({
			onSuccess: () => {
				refetchExercises()
			},
			onError: (error) => {
				toast({
					title: 'Error',
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	const { mutate: removeExercise, status: removeExerciseStatus } =
		api.exercises.removeAndDetachExerciseFromResource.useMutation({
			onSuccess: () => {
				refetchExercises()
			},
			onError: (error) => {
				toast({
					title: 'Error',
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	const { mutate: updateExercise, status: updateExerciseStatus } =
		api.exercises.updateExercise.useMutation({
			onSuccess: () => {
				refetchExercises()
			},
		})
	const { data: session } = useSession()
	const exercisePathRef = useRef<HTMLInputElement>(null)
	const editExercisePathRef = useRef<HTMLInputElement>(null)
	const [editExercisePath, setEditExercisePath] = useState('')

	return (
		<section
			className="flex flex-col gap-2 px-5"
			aria-labelledby="exercises-heading"
		>
			<div className="flex w-full flex-col gap-1">
				<h2 id="exercises-heading" className="text-lg font-semibold">
					Exercise
				</h2>
				{(!exercises || exercises.length === 0) && (
					<Dialog>
						<DialogTrigger asChild>
							<Button
								className="w-full"
								variant="outline"
								aria-label="Add new exercise to this lesson"
							>
								<Plus
									className="mr-2 size-4"
									strokeWidth={1.5}
									aria-hidden="true"
								/>
								Add Exercise
							</Button>
						</DialogTrigger>
						<DialogContent aria-describedby="create-exercise-description">
							<DialogHeader>
								<DialogTitle>Create New Exercise</DialogTitle>
							</DialogHeader>
							<div id="create-exercise-description" className="sr-only">
								Create a new exercise by specifying the path to the exercise
								files
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-exercise-path">
									Exercise Path (e.g. /04/01/problem)
								</Label>
								<Input
									id="new-exercise-path"
									ref={exercisePathRef}
									placeholder="Enter exercise path"
									aria-describedby="exercise-path-help"
								/>
								<div
									id="exercise-path-help"
									className="text-muted-foreground text-sm"
								>
									Specify the relative path to the exercise directory
								</div>
							</div>

							<DialogFooter>
								<DialogTrigger asChild>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											exercisePathRef.current?.blur()
										}}
									>
										Cancel
									</Button>
								</DialogTrigger>
								<DialogTrigger asChild>
									<Button
										type="button"
										disabled={createExerciseStatus === 'pending'}
										onClick={() => {
											if (!exercisePathRef.current?.value) {
												return
											}
											createExercise({
												parentResourceId: lesson.id,
												workshopApp: {
													path: exercisePathRef.current?.value,
												},
											})
										}}
										aria-describedby={
											createExerciseStatus === 'pending'
												? 'creating-exercise-status'
												: undefined
										}
									>
										{createExerciseStatus === 'pending' ? (
											<>
												<Spinner className="mr-2 size-4" aria-hidden="true" />
												Creating...
											</>
										) : (
											'Create and attach exercise'
										)}
									</Button>
								</DialogTrigger>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>
			{['pending'].includes(createExerciseStatus) && (
				<div
					className="flex items-center justify-center rounded-lg border p-3"
					role="status"
					aria-live="polite"
					id="creating-exercise-status"
				>
					<Spinner className="size-5" aria-hidden="true" />
					<span className="sr-only">Creating exercise...</span>
				</div>
			)}
			{exercises && exercises.length > 0 && (
				<div role="list" aria-label="Lesson exercises">
					{exercises.map((exercise, index) => (
						<div
							key={exercise.id}
							role="listitem"
							className="flex items-center justify-between rounded-lg border p-3"
							aria-labelledby={`exercise-${exercise.id}-label`}
						>
							<div className="flex items-center gap-2">
								{['pending'].includes(updateExerciseStatus) && (
									<div role="status" aria-live="polite">
										<Spinner className="size-4" aria-hidden="true" />
										<span className="sr-only">Updating exercise...</span>
									</div>
								)}
								<span
									className="text-muted-foreground text-sm"
									id={`exercise-${exercise.id}-label`}
								>
									Workshop App exercise path:
									<br />{' '}
									<span className="text-foreground font-semibold">
										{exercise?.fields?.workshopApp?.path}
									</span>
								</span>
							</div>
							<div
								className="flex items-center gap-2"
								role="group"
								aria-label={`Actions for exercise ${exercise?.fields?.workshopApp?.path}`}
							>
								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											disabled={['pending'].includes(removeExerciseStatus)}
											aria-label={`Delete exercise ${exercise?.fields?.workshopApp?.path}`}
										>
											{['pending'].includes(removeExerciseStatus) ? (
												<>
													<Spinner className="size-4" aria-hidden="true" />
													<span className="sr-only">Deleting...</span>
												</>
											) : (
												<Trash
													className="size-4"
													strokeWidth={1.5}
													aria-hidden="true"
												/>
											)}
										</Button>
									</DialogTrigger>
									<DialogContent aria-describedby="delete-exercise-description">
										<DialogHeader>
											<DialogTitle>
												Delete Exercise: {exercise?.fields?.workshopApp?.path}
											</DialogTitle>
										</DialogHeader>
										<div id="delete-exercise-description">
											This action cannot be undone. The exercise will be
											permanently removed from this lesson.
										</div>
										<DialogFooter>
											<DialogTrigger asChild>
												<Button variant="outline">Cancel</Button>
											</DialogTrigger>
											<DialogTrigger asChild>
												<Button
													variant="destructive"
													onClick={() =>
														removeExercise({
															exerciseId: exercise.id,
															parentId: lesson.id,
														})
													}
												>
													Delete Exercise
												</Button>
											</DialogTrigger>
										</DialogFooter>
									</DialogContent>
								</Dialog>
								<Dialog key={`edit-${exercise.id}`}>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											onClick={() =>
												setEditExercisePath(
													exercise?.fields?.workshopApp?.path || '',
												)
											}
											aria-label={`Edit exercise ${exercise?.fields?.workshopApp?.path}`}
										>
											<Pencil
												className="size-4"
												strokeWidth={1.5}
												aria-hidden="true"
											/>
											Edit
										</Button>
									</DialogTrigger>
									<DialogContent aria-describedby="edit-exercise-description">
										<DialogHeader>
											<DialogTitle>
												Edit Exercise: {exercise?.fields?.workshopApp?.path}
											</DialogTitle>
										</DialogHeader>
										<div id="edit-exercise-description" className="sr-only">
											Update the path for this exercise
										</div>
										<div className="space-y-2">
											<Label htmlFor={`edit-exercise-path-${exercise.id}`}>
												Workshop App exercise path (e.g. /04/01/problem)
											</Label>
											<Input
												id={`edit-exercise-path-${exercise.id}`}
												value={editExercisePath}
												onChange={(e) => setEditExercisePath(e.target.value)}
												ref={editExercisePathRef}
												placeholder="Enter exercise path"
												aria-describedby={`edit-exercise-path-help-${exercise.id}`}
											/>
											<div
												id={`edit-exercise-path-help-${exercise.id}`}
												className="text-muted-foreground text-sm"
											>
												Specify the relative path to the exercise directory
											</div>
										</div>
										<DialogFooter>
											<DialogTrigger asChild>
												<Button variant="outline">Cancel</Button>
											</DialogTrigger>
											<DialogTrigger asChild>
												<Button
													disabled={
														editExercisePath ===
															exercise?.fields?.workshopApp?.path ||
														updateExerciseStatus === 'pending'
													}
													onClick={() => {
														updateExercise({
															exerciseId: exercise.id,
															input: {
																workshopApp: {
																	path: editExercisePath,
																},
															},
														})
													}}
													aria-describedby={
														updateExerciseStatus === 'pending'
															? 'updating-exercise-status'
															: undefined
													}
												>
													{updateExerciseStatus === 'pending' ? (
														<>
															<Spinner
																className="mr-2 size-4"
																aria-hidden="true"
															/>
															Saving...
														</>
													) : (
														'Save changes'
													)}
												</Button>
											</DialogTrigger>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					))}
				</div>
			)}
			{exercises && exercises.length === 0 && (
				<div
					className="text-muted-foreground text-center text-sm opacity-75"
					role="status"
				>
					No exercises added to this lesson yet.
				</div>
			)}
			{updateExerciseStatus === 'pending' && (
				<div
					id="updating-exercise-status"
					role="status"
					aria-live="polite"
					className="sr-only"
				>
					Updating exercise...
				</div>
			)}
		</section>
	)
}
