import { inngest } from '@/inngest/inngest.server'
import { getQueryEngine } from '@/utils/vector-utils/rag'

import { PERFORM_RAG_QUERY } from '../events/rag'

export const queryRAG = inngest.createFunction(
	{ id: `performRAGQuery`, name: 'Perform RAG Query' },
	{
		event: PERFORM_RAG_QUERY,
	},
	async ({ event, step }) => {
		const query_result = await step.run(
			'perform retrieval-augmented generation',
			async () => {
				const query_engine = await getQueryEngine()
				query_engine.query({
					query: event.data.query,
				})
			},
		)

		return {
			query: event.data.query,
			response: query_result,
		}
	},
)
