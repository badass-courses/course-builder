'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { Email, EmailSchema, NewEmail } from '@/lib/emails'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getEmails(): Promise<Email[]> {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const emails = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'email'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		orderBy: desc(contentResource.createdAt),
	})

	const emailsParsed = z.array(EmailSchema).safeParse(emails)
	if (!emailsParsed.success) {
		console.error('Error parsing emails', emailsParsed)
		return []
	}

	return emailsParsed.data
}

export async function createEmail(input: NewEmail) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const newEmailId = v4()

	await db.insert(contentResource).values({
		id: newEmailId,
		type: 'email',
		fields: {
			title: input.fields.title,
			subject: input.fields.subject,
			body: input.fields.body,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.fields.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const email = await getEmail(newEmailId)

	revalidateTag('emails')

	return email
}

export async function updateEmail(input: Email) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentEmail = await getEmail(input.id)

	if (!currentEmail) {
		return createEmail(input)
	}

	let emailSlug = input.fields.slug

	if (input.fields.title !== currentEmail?.fields.title) {
		const splitSlug = currentEmail?.fields.slug.split('~') || ['', guid()]
		emailSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentEmail.id,
		fields: {
			...currentEmail.fields,
			...input.fields,
			slug: emailSlug,
		},
	})
}

export async function getEmail(slugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const email = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'email'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
	})

	const emailParsed = EmailSchema.safeParse(email)
	if (!emailParsed.success) {
		console.error('Error parsing email', emailParsed)
		return null
	}

	return emailParsed.data
}
