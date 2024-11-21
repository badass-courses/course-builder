import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { createPost } from '@/lib/posts-query'
import { createResource } from '@/lib/resources/create-resources'
import { getServerAuthSession } from '@/server/auth'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

import { CreatePostForm } from './create-post-form'

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
		<div className="flex flex-col">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
				<CardContent>
					<CreatePostForm
						resourceType={resourceType}
						onCreate={async (resource: ContentResource) => {
							'use server'
							redirect(`/${resource.fields?.slug}`)
						}}
						createPost={createPost}
					/>
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</div>
	)
}
