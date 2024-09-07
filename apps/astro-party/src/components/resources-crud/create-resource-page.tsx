import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { CreateResourceCard } from '@coursebuilder/ui/resources-crud/create-resource-card'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

export const dynamic = 'force-dynamic'

/**
 * Creates a new resource page for the given resource type.
 * @param resourceType The type of resource to create.
 * @param pathPrefix The path prefix to use for the resource. Defaults to an empty string. Optional.
 * @returns A React component that renders the CreateResourceCard component.
 */
export default async function CreateResourcePage({
	resourceType,
	pathPrefix = '',
}: {
	resourceType: string
	pathPrefix?: string
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="mx-auto flex w-full max-w-md flex-col pt-16">
			<h1 className="font-rounded fluid-2xl mb-5 w-full text-center font-semibold">
				Create new {resourceType}
			</h1>
			<CreateResourceForm
				resourceType={resourceType}
				onCreate={async (resource: ContentResource) => {
					'use server'
					redirect(
						`${pathPrefix}/${pluralize(resourceType)}/${resource.fields?.slug}/edit`,
					)
				}}
				createResource={createResource}
			/>
		</div>
	)
}
