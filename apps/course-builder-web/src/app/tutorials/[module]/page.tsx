import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq, like } from 'drizzle-orm'
import { last } from 'lodash'

import { Separator } from '@coursebuilder/ui'

export default async function ModulePage({
	params,
}: {
	params: { module: string }
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const course: any = await db.query.contentResource.findFirst({
		where: eq(
			contentResource.id,
			like(contentResource.id, `%${last(params.module.split('-'))}%`),
		),
	})

	if (!course) {
		notFound()
	}

	return (
		<div className="hidden h-full flex-col md:flex">
			<div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
				<h2 className="text-lg font-semibold">{course.fields.title}</h2>
				<p>{course.fields.description}</p>
				{ability.can('update', 'Content') && (
					<Link href={`/tutorials/${params.module}/edit`}>edit module</Link>
				)}
			</div>
			<Separator />
		</div>
	)
}
