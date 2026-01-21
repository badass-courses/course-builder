import {
	AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT,
	AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT,
	AUTHOR_ROLE_ASSIGNMENT_STARTED_EVENT,
} from '@/inngest/events/author-role-assignment'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'

/**
 * Inngest function to monitor and log author role assignments.
 * This provides observability for the author assignment process.
 * Uses idempotency to prevent duplicate runs for the same assignment.
 */
export const authorRoleAssignmentMonitor = inngest.createFunction(
	{
		id: 'author-role-assignment-monitor',
		name: 'Author Role Assignment Monitor',
		idempotency: 'event.data.email',
	},
	[
		{
			event: AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT,
		},
		{
			event: AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT,
		},
	],
	async ({ event, step }) => {
		// Use a unique key for idempotency based on email and event type
		const idempotencyKey = `${event.data.email}-${event.name}`

		switch (event.name) {
			case AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT: {
				await step.run(
					`log-assignment-completed-${idempotencyKey}`,
					async () => {
						await log.info('inngest.author.assignment.completed', {
							userId: event.data.userId,
							email: event.data.email,
							name: event.data.name,
							wasCreated: event.data.wasCreated,
							timestamp: event.data.timestamp,
						})
					},
				)
				break
			}

			case AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT: {
				await step.run(`log-assignment-failed-${idempotencyKey}`, async () => {
					await log.error('inngest.author.assignment.failed', {
						email: event.data.email,
						name: event.data.name,
						error: event.data.error,
						timestamp: event.data.timestamp,
					})
				})
				break
			}
		}

		return { event: event.name, data: event.data }
	},
)
