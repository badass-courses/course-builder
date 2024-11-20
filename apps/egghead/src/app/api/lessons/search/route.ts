import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { contentResource } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const searchTerm = searchParams.get('q')

	if (!searchTerm) {
		return NextResponse.json({ lessons: [] })
	}

	const { session } = await getServerAuthSession()
	const userId = session?.user?.id

	const lessons = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.title') LIKE ${`%${searchTerm}%`}`,
		),
		orderBy: [
			sql`CASE 
				WHEN ${contentResource.createdById} = ${userId} THEN 0 
				ELSE 1 
			END`,
			sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`,
		],
	})

	const parsedLessons = ContentResourceSchema.array().parse(lessons)
	return NextResponse.json({ lessons: parsedLessons })
}
