export const PERFORM_RAG_QUERY = 'rag/perform-query'

export type PerformRagQuery = {
	name: typeof PERFORM_RAG_QUERY
	data: {
		query: string
	}
}
