import * as React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { asc, like } from 'drizzle-orm'
import { last } from 'lodash'

import { EditLessonForm } from './_components/edit-lesson-form'

export const dynamic = 'force-dynamic'

export default async function LessonEditPage({
	params,
}: {
	params: { lesson: string }
}) {
	const { ability } = await getServerAuthSession()
	const parsedLesson = LessonSchema.safeParse(
		await db.query.contentResource.findFirst({
			where: like(contentResource.id, `%${last(params.lesson.split('-'))}%`),
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
		}),
	)

	if (!parsedLesson.success || !ability.can('create', 'Content')) {
		notFound()
	}

	const resource = parsedLesson.data.resources?.[0]?.resource.id

	console.log({ lesson: parsedLesson.data })

	return (
		<EditLessonForm key={parsedLesson.data.id} lesson={parsedLesson.data} />
	)
}
