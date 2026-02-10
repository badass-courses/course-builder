'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { Email, EmailSchema, NewEmail } from '@/lib/emails'
import { getServerAuthSession } from '@/server/auth'
import slugify from '@sindresorhus/slugify'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

import { guid } from '@coursebuilder/utils-core/guid'

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
			...input.fields,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.fields.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const email = await getEmail(newEmailId)

	revalidateTag('emails', 'max')

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

/**
 * Create email without auth (for Inngest/system use)
 *
 * @param input - Email data (title, subject, body)
 * @returns Created email or null on failure
 */
export async function createEmailSimple(
	input: NewEmail,
): Promise<Email | null> {
	const emailId = guid()
	const slug = input.fields.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

	const emailData = {
		id: emailId,
		type: 'email',
		createdById: 'system',
		fields: {
			...input.fields,
			slug: `${slug}-${emailId.slice(0, 8)}`,
			state: 'draft' as const,
			visibility: 'unlisted' as const,
		},
	}

	await db.insert(contentResource).values(emailData)

	const createdEmail = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, emailId),
	})

	const parsed = EmailSchema.safeParse(createdEmail)
	if (!parsed.success) {
		console.error('Failed to parse created email', createdEmail)
		return null
	}

	return parsed.data
}

/**
 * Get email by ID without auth (for Inngest/system use)
 *
 * @param emailId - Email resource ID
 * @returns Email or null if not found
 */
export async function getEmailSimple(emailId: string): Promise<Email | null> {
	const email = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, emailId),
			eq(contentResource.type, 'email'),
		),
	})

	if (!email) return null

	const parsed = EmailSchema.safeParse(email)
	if (!parsed.success) {
		console.error('Failed to parse email', email)
		return null
	}

	return parsed.data
}

/**
 * Update email without auth (for Inngest/system use)
 *
 * @param email - Email data to update
 * @returns Updated email or null on failure
 */
export async function updateEmailSimple(email: Email): Promise<Email | null> {
	await db
		.update(contentResource)
		.set({
			fields: email.fields,
			updatedAt: new Date(),
		})
		.where(eq(contentResource.id, email.id))

	return await getEmailSimple(email.id)
}
