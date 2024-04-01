import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'
import { CreateResourceCard } from '@coursebuilder/ui/resources-crud/create-resource-card'

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<CreateResourceCard
				resourceType={'article'}
				onCreate={async (resource: ContentResource) => {
					'use server'
					redirect(`/${pluralize(resource.type)}/edit/${resource.fields?.slug}`)
				}}
				createResource={createResource}
			/>
		</div>
	)
}
