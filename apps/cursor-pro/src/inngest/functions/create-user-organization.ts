import { courseBuilderAdapter, db } from '@/db'
import { NonRetriableError } from 'inngest'

import { inngest } from '../inngest.server'

export const CREATE_USER_ORGANIZATIONS_EVENT = 'create-user-organizations'

export type CreateUserOrganizations = {
	name: typeof CREATE_USER_ORGANIZATIONS_EVENT
	data: {
		limit?: number
		offset?: number
	}
}

export const createUserOrganizations = inngest.createFunction(
	{ id: 'create-user-organizations', name: 'Create User Organizations' },
	{ event: CREATE_USER_ORGANIZATIONS_EVENT },
	async ({ event, step }) => {
		const limit = event.data.limit || 25

		console.log('limit', limit)
		const users = await step.run('get users', async () => {
			return await db.query.users
				.findMany({
					with: {
						organizationMemberships: true,
					},
					orderBy: (users, { asc }) => [asc(users.createdAt)],
				})
				.then((users) =>
					users
						.filter((user) => !user.organizationMemberships.length)
						.slice(0, limit),
				)
		})

		for (const user of users) {
			const organization = await step.run(
				'create user organization',
				async () => {
					// creating a personal organization for the user
					// every user gets an organization of their very own
					const personalOrganization =
						await courseBuilderAdapter.createOrganization({
							name: `Personal (${user.email})`,
						})

					if (!personalOrganization) {
						throw new Error('Failed to create personal organization')
					}

					return personalOrganization
				},
			)

			const membership = await step.run(
				'add user to organization',
				async () => {
					const membership = await courseBuilderAdapter.addMemberToOrganization(
						{
							organizationId: organization.id,
							userId: user.id,
							invitedById: user.id,
						},
					)

					if (!membership) {
						throw new Error('Failed to add user to personal organization')
					}

					return membership
				},
			)

			await step.run('add role to user', async () => {
				await courseBuilderAdapter.addRoleForMember({
					organizationId: organization.id,
					memberId: membership.id,
					role: 'owner',
				})
			})
		}

		if (users.length >= limit) {
			await step.sendEvent('create-user-organizations', {
				name: CREATE_USER_ORGANIZATIONS_EVENT,
				data: {
					limit,
				},
			})
		}
	},
)
