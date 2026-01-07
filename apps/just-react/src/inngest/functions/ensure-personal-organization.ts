import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'

import { ENSURE_PERSONAL_ORGANIZATION_EVENT } from '../events/ensure-personal-organization'
import { inngest } from '../inngest.server'

export const ensurePersonalOrganizationWorkflow = inngest.createFunction(
	{
		id: 'ensure-personal-organization',
		name: 'Ensure Personal Organization',
	},
	{
		event: ENSURE_PERSONAL_ORGANIZATION_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		const { userId, createIfMissing = true } = event.data

		const user = await step.run('get user', async () => {
			return adapter.getUserById(userId)
		})

		if (!user) {
			throw new Error(`User not found: ${userId}`)
		}

		if (!createIfMissing) {
			const result = await step.run('check personal organization', async () => {
				const { getPersonalOrganization } = await import(
					'@/lib/personal-organization-service'
				)
				return getPersonalOrganization(user, adapter)
			})

			return {
				user,
				organization: result?.organization || null,
				membership: result?.membership || null,
				wasCreated: false,
			}
		}

		const result = await step.run('ensure personal organization', async () => {
			return ensurePersonalOrganizationWithLearnerRole(user, adapter)
		})

		return {
			user,
			organization: result.organization,
			membership: result.membership,
			wasCreated: result.wasCreated,
		}
	},
)
