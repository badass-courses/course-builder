import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSurvey } from '@/lib/surveys-query'
import { getServerAuthSession } from '@/server/auth'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import { SurveyDetailClient } from '../_components/survey-detail-client'

export default async function SurveyDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { ability } = await getServerAuthSession()

	if (ability.cannot('manage', 'all')) {
		notFound()
	}
	const { slug } = await params

	const survey = await getSurvey(slug)

	if (!survey) {
		notFound()
	}

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
				<div className="mb-5 flex w-full flex-col items-start gap-4">
					<Button variant="link" size="sm" asChild className="px-0">
						<Link href="/admin/surveys">
							<ChevronLeft className="size-4" />
							Back to Surveys
						</Link>
					</Button>
					<h1 className="font-heading text-xl font-bold sm:text-3xl">
						{survey.fields?.title || 'Untitled Survey'}
					</h1>
				</div>
				<SurveyDetailClient survey={survey} />
			</div>
		</main>
	)
}
