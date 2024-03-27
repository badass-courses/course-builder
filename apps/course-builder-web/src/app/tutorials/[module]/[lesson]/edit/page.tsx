import * as React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import { getTip } from '@/lib/tips-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { asc, like } from 'drizzle-orm'
import { last } from 'lodash'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

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
		}),
	)

	if (!parsedLesson.success || !ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<EditLessonForm key={parsedLesson.data.id} lesson={parsedLesson.data} />
	)
}
