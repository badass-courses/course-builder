import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getCohort } from '@/lib/cohorts-query'
import { getServerAuthSession } from '@/server/auth'

import { EditCohortForm } from './_components/edit-cohort-form'

export const dynamic = 'force-dynamic'

export default async function CohortEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	const cohort = await getCohort(params.slug)

	if (!cohort || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditCohortForm key={cohort.fields.slug} cohort={cohort} />
}
