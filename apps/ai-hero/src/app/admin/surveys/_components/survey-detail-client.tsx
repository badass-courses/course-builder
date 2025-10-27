'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { Question, Survey, SurveyWithQuestions } from '@/lib/surveys'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@coursebuilder/ui'

import { QuestionsList } from './questions-list'
import SurveyCrudDialog from './survey-crud-dialog'

export function SurveyDetailClient({
	survey: initialSurvey,
}: {
	survey: SurveyWithQuestions
}) {
	const [survey, setSurvey] = React.useState<SurveyWithQuestions>(initialSurvey)
	const router = useRouter()

	const handleUpdate = async (updatedSurvey: Survey) => {
		const oldSlug = survey.fields?.slug
		const newSlug = updatedSurvey.fields?.slug

		// Update only the fields, keep existing resources
		setSurvey({ ...survey, fields: updatedSurvey.fields })

		// Redirect if slug changed
		if (oldSlug !== newSlug && newSlug) {
			router.push(`/admin/surveys/${newSlug}`)
		}
	}

	const questions: Question[] =
		survey.resources
			?.filter((r) => r.resource.type === 'question')
			.map((r) => r.resource) || []

	return (
		<div className="space-y-6">
			<Tabs defaultValue="questions" className="w-full">
				<TabsList>
					<TabsTrigger value="questions">Questions</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="questions" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Survey Questions</CardTitle>
						</CardHeader>
						<CardContent>
							<QuestionsList
								surveyId={survey.id}
								initialQuestions={questions}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Survey Settings</CardTitle>
							<SurveyCrudDialog survey={survey} onSubmit={handleUpdate}>
								<Button variant="outline" size="sm">
									Edit Settings
								</Button>
							</SurveyCrudDialog>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium">Title</p>
								<p className="text-muted-foreground text-sm">
									{survey.fields?.title}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">Slug</p>
								<p className="text-muted-foreground text-sm">
									{survey.fields?.slug}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">State</p>
								<p className="text-muted-foreground text-sm">
									{survey.fields?.state}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">Visibility</p>
								<p className="text-muted-foreground text-sm">
									{survey.fields?.visibility}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">After Completion Messages</p>
								<div className="mt-2 space-y-2 rounded-lg border p-3 text-sm">
									<div>
										<span className="font-medium">Neutral: </span>
										<span className="text-muted-foreground">
											{survey.fields?.afterCompletionMessages?.neutral?.default}
										</span>
									</div>
									<div>
										<span className="font-medium">Correct: </span>
										<span className="text-muted-foreground">
											{survey.fields?.afterCompletionMessages?.correct?.default}
										</span>
									</div>
									<div>
										<span className="font-medium">Incorrect: </span>
										<span className="text-muted-foreground">
											{
												survey.fields?.afterCompletionMessages?.incorrect
													?.default
											}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
