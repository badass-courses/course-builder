import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
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

	console.log('CohortEditPage:', {
		params,
		cohort,
		fields: cohort?.fields,
		id: cohort?.id,
		type: cohort?.type,
		ability: ability.can('create', 'Content'),
	})

	if (!cohort || !ability.can('create', 'Content')) {
		console.error('CohortEditPage: Not found or no permission', {
			cohort: !!cohort,
			canCreate: ability.can('create', 'Content'),
		})
		notFound()
	}

	return (
		<LayoutClient>
			<EditCohortForm key={cohort.fields.slug} resource={cohort} />
		</LayoutClient>
	)
}
