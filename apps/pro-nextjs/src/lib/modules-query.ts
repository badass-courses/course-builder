'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { ModuleSchema } from '@/lib/module'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'

export async function getModule(moduleSlugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

	const moduleData = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					moduleSlugOrId,
				),
				eq(contentResource.id, moduleSlugOrId),
			),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: {
										with: {
											resources: {
												with: {
													resource: true,
												},
											},
										},
									},
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

	const parsedModule = ModuleSchema.safeParse(moduleData)
	if (!parsedModule.success) {
		console.error('Error parsing module', moduleData, parsedModule.error)
		return null
	}

	return parsedModule.data
}
