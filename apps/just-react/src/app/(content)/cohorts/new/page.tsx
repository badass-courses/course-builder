import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { CreateResourceCard } from '@coursebuilder/ui/resources-crud/create-resource-card'

export const dynamic = 'force-dynamic'

export default async function NewCohortPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<CreateResourceCard
				resourceType={'cohort'}
				onCreate={async (resource: ContentResource) => {
					'use server'
					redirect(`/${pluralize(resource.type)}/${resource.fields?.slug}/edit`)
				}}
				createResource={createResource}
			/>
		</div>
	)
}
