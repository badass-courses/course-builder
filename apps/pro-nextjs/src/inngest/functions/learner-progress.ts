import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { inngest } from '@/inngest/inngest.server'

export const learnerProgress = inngest.createFunction(
	{ id: 'learner progress' },
	{ event: LESSON_COMPLETED_EVENT },
	async ({ event, step }) => {
		// load all of their progress
		// analyze where they are at
		// send a personalized email based on that progress
		return 'encouraging email was sent'
	},
)
