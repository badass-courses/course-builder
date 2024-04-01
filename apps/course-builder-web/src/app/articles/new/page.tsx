import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { CreateResourceCard } from '@/components/resources-crud/create-resource-card'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'

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
				onCreate={(resource: ContentResource) => {
					'use server'
					redirect(`/${pluralize(resource.type)}/edit/${resource.fields?.slug}`)
				}}
			/>
		</div>
	)
}
