import { inngest } from '@/inngest/inngest.server'
import {
	add_concept,
	get_related_concepts,
} from '@/utils/vector-utils/concepts'

import { CONCEPT_TAGS_REQUESTED } from '../../events/concepts'

export const getOrCreateConcept = inngest.createFunction(
	{ id: `getOrCreateConcept`, name: 'Get or Create Concept' },
	{
		event: CONCEPT_TAGS_REQUESTED,
	},
	async ({ event, step }) => {
		const related_concepts = await step.run(
			'check for similar concepts',
			async () => {
				return await get_related_concepts(event.data.key)
			},
		)

		const new_concept = await step.run('create new concept', async () => {
			return await add_concept(event.data.key)
		})

		// TODO:
		// 1. check for similarity, we need to tune this.
		// 2. if similarity is found, broadcast a REQUEST_CONCEPT_SELECTION event
		// 3. if no similarity is found, create a new concept and broadcast a REQUEST_CONCEPT_SELECTION event

		return { new_concept, related_concepts }
	},
)
