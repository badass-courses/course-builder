import * as React from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import { getServerAuthSession } from '@/server/auth'
import { like } from 'drizzle-orm'
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
		}),
	)

	if (!parsedLesson.success || !ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<EditLessonForm key={parsedLesson.data.id} lesson={parsedLesson.data} />
	)
}
