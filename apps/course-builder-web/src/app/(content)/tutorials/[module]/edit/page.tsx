import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import ModuleEdit from '@/components/module-edit'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { asc, like, sql } from 'drizzle-orm'
import { last } from 'lodash'

export const dynamic = 'force-dynamic'

export default async function EditTutorialPage({
	params,
}: {
	params: { module: string }
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		redirect('/login')
	}

	const tutorial = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(params.module.split('-'))}%`),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!tutorial) {
		notFound()
	}

	return (
		<>
			<ModuleEdit tutorial={tutorial} />
		</>
	)
}
