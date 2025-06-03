import { courseBuilderAdapter, db } from '@/db'
import { NonRetriableError } from 'inngest'

import { ENSURE_PERSONAL_ORGANIZATION_EVENT } from '../events/ensure-personal-organization'
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
			await step.run(`create organization for user ${user.id}`, async () => {
				await step.sendEvent(ENSURE_PERSONAL_ORGANIZATION_EVENT, {
					name: ENSURE_PERSONAL_ORGANIZATION_EVENT,
					data: {
						userId: user.id,
						createIfMissing: true,
					},
					user,
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
