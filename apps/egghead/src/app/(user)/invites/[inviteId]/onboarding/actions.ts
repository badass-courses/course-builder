'use server'

import { redirect } from 'next/navigation'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, invites, profiles, users } from '@/db/schema'
import { addRoleToUser } from '@/lib/users'
import { eq } from 'drizzle-orm'

interface CreateInstructorProfileParams {
	inviteId: string
	firstName: string
	lastName: string
	email: string
	twitter?: string
	website?: string
	bio?: string
	bluesky?: string
}

export async function createInstructorProfile({
	inviteId,
	firstName,
	lastName,
	email,
	twitter,
	website,
	bluesky,
	bio,
}: CreateInstructorProfileParams) {
	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, inviteId),
		columns: {
			inviteState: true,
			acceptedEmail: true,
		},
	})

	if (!invite || invite.inviteState !== 'VERIFIED' || !invite.acceptedEmail) {
		throw new Error('Invalid invite')
	}

	const { acceptedEmail } = invite

	await db.transaction(async (tx) => {
		const id = crypto.randomUUID()
		// Create user
		const user = await tx.insert(users).values({
			id: id,
			email: acceptedEmail,
			name: `${firstName} ${lastName}`,
			createdAt: new Date(),
		})

		await addRoleToUser(id, 'contributor')

		// create profile
		await tx.insert(profiles).values({
			id: crypto.randomUUID(),
			userId: id,
			type: 'instructor',
			fields: {
				blueSky: bluesky || null,
				twitter: twitter || null,
				website: website || null,
				bio: bio || null,
			},
			createdAt: new Date(),
		})

		// find or create egghead user
		let eggheadUser = null
		try {
			eggheadUser = await getEggheadUserByEmail(acceptedEmail)
		} catch (error) {
			console.error('error', error)
		}

		if (!eggheadUser) {
			await createEggheadUser(acceptedEmail)
			eggheadUser = await getEggheadUserByEmail(acceptedEmail)
		}

		if (!eggheadUser) {
			throw new Error('Failed to create egghead user')
		}

		const eggheadInstructorId = await createEggheadInstructor({
			userId: eggheadUser.id,
			email: acceptedEmail,
			firstName,
			lastName,
			twitter: twitter ?? '',
			website: website ?? '',
			bio: bio ?? '',
		})

		// add instructor role through join table
		await addInstructorRoleToEggheadUser({
			userId: eggheadUser.id,
			instructorId: eggheadInstructorId,
		})

		// add revenue split
		await addRevenueSplitToEggheadInstructor({ eggheadInstructorId })

		// Update invite state
		await tx
			.update(invites)
			.set({ inviteState: 'COMPLETED', completedAt: new Date(), userId: id })
			.where(eq(invites.id, inviteId))
	})

	redirect(`/invites/${inviteId}/onboarding/completed`)
}

async function addInstructorRoleToEggheadUser({
	userId,
	instructorId,
}: {
	userId: string
	instructorId: string
}) {
	const instructorRoleQuery = `
    INSERT INTO users_roles (user_id, role_id)
    VALUES (${userId}, 8)
  `

	await eggheadPgQuery(instructorRoleQuery)
}

async function addRevenueSplitToEggheadInstructor({
	eggheadInstructorId,
}: {
	eggheadInstructorId: string
}) {
	const revenueSplitQuery = `
    INSERT INTO instructor_revenue_splits (
      instructor_id,
      credit_to_instructor_id,
      percentage,
      from_date
    ) VALUES (
      ${eggheadInstructorId},
      NULL,
      0.2,
      NOW()
    );
  `

	await eggheadPgQuery(revenueSplitQuery)
}

async function createEggheadInstructor({
	userId,
	email,
	firstName,
	lastName,
	twitter,
	website,
	bio,
}: {
	userId: string
	firstName: string
	lastName: string
	email: string
	twitter: string
	website: string
	bio: string
}) {
	// add instructor to egghead user
	const columns = [
		'first_name',
		'last_name',
		'slug',
		'user_id',
		'email',
		'twitter',
		'website',
		'state',
		'bio_short',
	]

	const values = [
		firstName,
		lastName,
		`${firstName}-${lastName}`,
		userId,
		email,
		twitter,
		website,
		'invited',
		bio,
	]

	const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

	const query = `
    INSERT INTO instructors (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING id
  `

	const eggheadInstructorResult = await eggheadPgQuery(query, values)

	return eggheadInstructorResult.rows[0].id
}

async function createEggheadUser(email: string) {
	return await fetch('https://app.egghead.io/api/v1/users/send_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			email,
		}),
	}).then(async (res) => {
		if (!res.ok) {
			throw new Error(
				`Failed to create egghead user: ${res.status} ${res.statusText}`,
			)
		}
		const data = await res.json()
		if (!data) {
			throw new Error('No data returned from egghead API')
		}
		return data
	})
}

async function getEggheadUserByEmail(email: string) {
	return await fetch(
		`https://app.egghead.io/api/v1/users/${email}?by_email=true&support=true`,
		{
			headers: {
				Authorization: `Bearer ${process.env.EGGHEAD_ADMIN_TOKEN}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
	).then(async (res) => {
		if (!res.ok) {
			console.error('Full response:', {
				status: res.status,
				statusText: res.statusText,
				headers: Object.fromEntries(res.headers.entries()),
			})
			throw new Error(
				`Failed to get egghead user: ${res.status} ${res.statusText}`,
			)
		}
		return res.json()
	})
}
