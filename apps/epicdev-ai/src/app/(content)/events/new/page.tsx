import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { CreateResourceCard } from '@coursebuilder/ui/resources-crud/create-resource-card'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div>
			<CreateResourcePage resourceType={'event'} />
		</div>
	)
}
