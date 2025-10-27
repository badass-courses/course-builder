import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import {
	buildSurveyConfig,
	getSurvey,
	transformSurveyToQuizResource,
} from '@/lib/surveys-query'

import { SurveyPageClient } from '../_components/survey-page-client'

export default async function SurveyBySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const survey = await getSurvey(slug)

	if (!survey) {
		notFound()
	}

	// Check if survey is published
	// if (survey.fields?.state !== 'published') {
	// 	notFound()
	// }

	const quizResource = await transformSurveyToQuizResource(survey)
	const surveyConfig = await buildSurveyConfig(survey.fields)

	return (
		<LayoutClient withContainer>
			<div className="relative flex min-h-[calc(100vh-var(--nav-height))] items-center justify-center">
				<SurveyPageClient
					quizResource={quizResource}
					surveyConfig={surveyConfig}
					surveyId={survey.fields?.slug}
				/>
			</div>
		</LayoutClient>
	)
}
