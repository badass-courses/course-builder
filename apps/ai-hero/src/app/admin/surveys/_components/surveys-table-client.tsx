'use client'

import * as React from 'react'
import Link from 'next/link'
import { deleteSurveyAction } from '@/lib/surveys-query'
import type { SurveyWithQuestions } from '@/lib/surveys-schemas'
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui'

import SurveyCrudDialog from './survey-crud-dialog'

// UI-only type for displaying surveys with question counts
type SurveyWithCount = SurveyWithQuestions & { questionCount: number }

export function SurveysTableClient({
	initialSurveys,
}: {
	initialSurveys: SurveyWithQuestions[]
}) {
	// Compute question counts on the client for UI display
	const [surveys, setSurveys] = React.useState<SurveyWithCount[]>(
		initialSurveys.map((s) => ({
			...s,
			questionCount: s.resources?.length || 0,
		})),
	)
	const [searchTerm, setSearchTerm] = React.useState('')
	const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
		isOpen: boolean
		surveyId: string | null
	}>({ isOpen: false, surveyId: null })

	const filteredSurveys = surveys.filter((survey) => {
		const title = survey.fields?.title?.toLowerCase() || ''
		const slug = survey.fields?.slug?.toLowerCase() || ''
		const search = searchTerm.toLowerCase()
		return title.includes(search) || slug.includes(search)
	})

	const handleCreate = async (survey: any) => {
		setSurveys([
			{ ...survey, questionCount: survey.resources?.length || 0 },
			...surveys,
		])
	}

	const handleDelete = async (surveyId: string) => {
		try {
			await deleteSurveyAction(surveyId)
			setSurveys(surveys.filter((s) => s.id !== surveyId))
			setDeleteConfirmation({ isOpen: false, surveyId: null })
		} catch (error) {
			console.error('Failed to delete survey:', error)
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2 top-2.5 size-4 text-gray-400" />
					<Input
						placeholder="Search surveys..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
					/>
				</div>
				<SurveyCrudDialog onSubmit={handleCreate}>
					<Button className="w-full sm:w-auto">
						<Plus className="mr-2 size-4" /> Create Survey
					</Button>
				</SurveyCrudDialog>
			</div>

			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead className="text-center">Questions</TableHead>
							<TableHead>State</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSurveys.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-muted-foreground text-center"
								>
									No surveys found
								</TableCell>
							</TableRow>
						) : (
							filteredSurveys.map((survey) => (
								<TableRow key={survey.id}>
									<TableCell className="font-medium">
										<Link
											href={`/admin/surveys/${survey.fields?.slug}`}
											className="hover:underline"
										>
											{survey.fields?.title || 'Untitled'}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{survey.fields?.slug}
									</TableCell>
									<TableCell className="text-center">
										{survey.questionCount}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
												survey.fields?.state === 'published'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{survey.fields?.state || 'draft'}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button variant="ghost" size="icon" asChild>
												<Link
													target="_blank"
													href={`/survey/${survey.fields?.slug}`}
												>
													<ExternalLink className="size-4" />
												</Link>
											</Button>
											<Button variant="outline" size="icon" asChild>
												<Link href={`/admin/surveys/${survey.fields?.slug}`}>
													<Pencil className="size-4" />
												</Link>
											</Button>
											<Button
												variant="destructive"
												size="icon"
												onClick={() =>
													setDeleteConfirmation({
														isOpen: true,
														surveyId: survey.id,
													})
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<Dialog
				open={deleteConfirmation.isOpen}
				onOpenChange={(isOpen) =>
					setDeleteConfirmation({ isOpen, surveyId: null })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Survey</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this survey? This action cannot be
							undone.
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
									deleteConfirmation.surveyId &&
									handleDelete(deleteConfirmation.surveyId)
								}
							>
								Delete
							</Button>
						</DialogTrigger>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
