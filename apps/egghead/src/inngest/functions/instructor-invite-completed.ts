import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { invites, organizationMemberships, profiles, users } from '@/db/schema'
import { INSTRUCTOR_INVITE_COMPLETED_EVENT } from '@/inngest/events/instructor-invite-completed'
import { inngest } from '@/inngest/inngest.server'
import { addRoleToUser } from '@/lib/users'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

export const instructorInviteCompleted = inngest.createFunction(
	{
		id: `instructor-invite-completed`,
		name: 'Instructor Invite Completed',
	},
	{
		event: INSTRUCTOR_INVITE_COMPLETED_EVENT,
	},
	async ({ event, step }) => {
		const invite = await step.run('get instructor invite', async () => {
			return await db.query.invites.findFirst({
				where: eq(invites.id, event.data.inviteId),
				columns: {
					inviteState: true,
					acceptedEmail: true,
					invitedById: true,
				},
			})
		})

		if (
			!invite ||
			invite.inviteState !== 'VERIFIED' ||
			!invite.acceptedEmail ||
			!invite.invitedById
		) {
			throw new NonRetriableError('No valid invite found')
		}

		const { acceptedEmail, invitedById } = invite
		const id = crypto.randomUUID()

		const user = await step.run('create user in builder', async () => {
			return await db.insert(users).values({
				id,
				email: acceptedEmail,
				name: `${event.data.firstName} ${event.data.lastName}`,
			})
		})

		await step.run('add contributor role to user', async () => {
			return await addRoleToUser(id, 'contributor')
		})

		await step.run('add user to egghead organization', async () => {
			await db.insert(organizationMemberships).values({
				id: crypto.randomUUID(),
				organizationId: 'ea57ef92-ac03-eb83-ba03-69ac0a4689d7', //'4a2f87c3-bd6e-4a50-ae1d-35b91c7f624d',
				userId: id,
				role: 'instructor',
				invitedById,
				createdAt: new Date(),
			})
		})

		await step.run('create builder instructor profile', async () => {
			await db.insert(profiles).values({
				id: crypto.randomUUID(),
				userId: id,
				type: 'instructor',
				fields: {
					blueSky: event.data.bluesky || null,
					twitter: event.data.twitter || null,
					website: event.data.website || null,
					bio: event.data.bio || null,
				},
				createdAt: new Date(),
			})
		})

		let eggheadUser = null
		eggheadUser = await step.run('attempt to get egghead user', async () => {
			return await getEggheadUserByEmail(acceptedEmail)
		})

		if (!eggheadUser || !eggheadUser.id) {
			eggheadUser = await step.run('create egghead user', async () => {
				await createEggheadUser(acceptedEmail)
				return await getEggheadUserByEmail(acceptedEmail)
			})
		}

		if (!eggheadUser && !eggheadUser.id) {
			throw new NonRetriableError('Failed to find/create egghead user')
		}

		const eggheadInstructorId = await step.run(
			'create egghead instructor',
			async () => {
				return await createEggheadInstructor({
					userId: eggheadUser.id,
					email: acceptedEmail,
					firstName: event.data.firstName,
					lastName: event.data.lastName,
					twitter: event.data.twitter ?? '',
					website: event.data.website ?? '',
					bio: event.data.bio ?? '',
				})
			},
		)

		await step.run('add instructor role to egghead user', async () => {
			await addInstructorRoleToEggheadUser({
				userId: eggheadUser.id,
			})
		})

		await step.run('add revenue split to egghead instructor', async () => {
			await addRevenueSplitToEggheadInstructor({
				eggheadInstructorId,
			})
		})

		const inviteUpdate = await step.run(
			'update invite state to completed',
			async () => {
				return await db
					.update(invites)
					.set({
						inviteState: 'COMPLETED',
						completedAt: new Date(),
						userId: id,
					})
					.where(eq(invites.id, invitedById))
			},
		)

		revalidatePath(`/invites/${event.data.inviteId}/onboarding/completed`)

		return {
			inviteId: event.data.inviteId,
		}
	},
)

async function addInstructorRoleToEggheadUser({ userId }: { userId: string }) {
	const instructorRoleQuery = `
    INSERT INTO users_roles (user_id, role_id)
    VALUES ($1, $2)
  `

	await eggheadPgQuery(instructorRoleQuery, [userId, 8])
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
      $1,
      $2,
      $3,
      $4
    );
  `

	await eggheadPgQuery(revenueSplitQuery, [
		eggheadInstructorId,
		null,
		0.2,
		new Date(),
	])
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
		const data = await res.json()
		console.log('egghead user data', data)
		return data
	})
}
