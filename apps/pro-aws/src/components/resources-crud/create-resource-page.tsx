import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

export const dynamic = 'force-dynamic'

export default async function CreateResourcePage({
	resourceType,
}: {
	resourceType: string
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center py-10 lg:border-x">
			<div className="w-full max-w-sm">
				<h1 className="mb-8 text-3xl font-bold capitalize">
					Create New {resourceType}
				</h1>
				<CreateResourceForm
					resourceType={resourceType}
					onCreate={async (resource: ContentResource) => {
						'use server'
						redirect(
							`/${pluralize(resourceType)}/${resource.fields?.slug}/edit`,
						)
					}}
					createResource={createResource}
				/>
			</div>
		</div>
	)
}
