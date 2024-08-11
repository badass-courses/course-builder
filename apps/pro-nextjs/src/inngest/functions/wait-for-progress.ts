import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { inngest } from '@/inngest/inngest.server'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const waitForProgress = inngest.createFunction(
	{ id: 'wait for progress' },
	{ event: NEW_PURCHASE_CREATED_EVENT },
	async ({ event, step }) => {
		const progress = await step.waitForEvent('wait for learner progress', {
			event: LESSON_COMPLETED_EVENT,
			timeout: '2m',
		})

		if (!progress) {
			// send them an encouragement email
			return 'no progress was made'
		}

		return 'progress was made'
	},
)
