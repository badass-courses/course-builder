import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { invites, organizationMemberships, profiles, users } from '@/db/schema'
import { INSTRUCTOR_INVITE_COMPLETED_EVENT } from '@/inngest/events/instructor-invite-completed'
import { inngest } from '@/inngest/inngest.server'
import {
	addInstructorRoleToEggheadUser,
	addRevenueSplitToEggheadInstructor,
	createEggheadInstructor,
	createEggheadUser,
	getEggheadUserByEmail,
} from '@/lib/egghead'
import { addRoleToUser } from '@/lib/users'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

const EGGHEAD_ORGANIZATION_ID = '4a2f87c3-bd6e-4a50-ae1d-35b91c7f624d'

const TEAM_SLACK_IDS = ['U025C46HVMX', 'U050Q7CM0', 'U030KRULU', 'UDLK3M6JW']

export const instructorInviteCompleted = inngest.createFunction(
	{
		id: `instructor-invite-completed`,
		name: 'Instructor Invite Completed',
	},
	{
		event: INSTRUCTOR_INVITE_COMPLETED_EVENT,
	},
	async ({ event, step, notificationProvider }) => {
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
				image: event.data.profileImageUrl ?? '',
			})
		})

		await step.run('add contributor role to user', async () => {
			return await addRoleToUser(id, 'contributor')
		})

		await step.run('add user to egghead organization', async () => {
			await db.insert(organizationMemberships).values({
				id: crypto.randomUUID(),
				organizationId: EGGHEAD_ORGANIZATION_ID,
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
					profileImageUrl: event.data.profileImageUrl ?? '',
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
					.where(eq(invites.id, event.data.inviteId))
			},
		)

		const slackChannel = await step.run('Create slack channel', async () => {
			const channelName =
				`cc-${event.data.firstName.toLowerCase()}-${event.data.lastName.toLowerCase()}`
					.replace(/[^a-z0-9-]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')

			return await notificationProvider.createChannel({
				name: channelName,
				is_private: true,
			})
		})

		const inviteToChannel = await step.run(
			'Invite to slack channel',
			async () => {
				return await notificationProvider.inviteToChannel({
					channel: slackChannel.channel.id,
					users: TEAM_SLACK_IDS,
					force: true,
				})
			},
		)

		const postEphemeral = await step.run(
			'Post ephemeral message to slack channel',
			async () => {
				return await notificationProvider.postEphemeral({
					channel: slackChannel.channel.id,
					user: `${invite.invitedById}`,
					text: `*A new instructor has completed the invite process.*`,
					attachments: [
						{
							text: `Hey (${event.data.email}) :wave: welcome! We'll use this channel to talk about content you want to create. As a first step before starting on a course we like to publish a lesson to get you started. Do you have any ideas for a lesson-sized topic you'd like to cover?`,
						},
					],
				})
			},
		)

		revalidatePath(`/invites/${event.data.inviteId}/onboarding/completed`)

		return {
			inviteId: event.data.inviteId,
		}
	},
)
