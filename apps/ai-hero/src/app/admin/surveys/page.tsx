import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAllSurveys } from '@/lib/surveys-query'
import { getServerAuthSession } from '@/server/auth'

import { SurveysTableClient } from './_components/surveys-table-client'

export default async function SurveysIndexPage() {
	const { ability } = await getServerAuthSession()

	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const allSurveys = await getAllSurveys()

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="font-heading text-xl font-bold sm:text-3xl">
						Surveys
					</h1>
				</div>
				<SurveysTableClient initialSurveys={allSurveys} />
			</div>
		</main>
	)
}
