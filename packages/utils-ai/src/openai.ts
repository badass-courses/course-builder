import OpenAI from 'openai'

/**
 * OpenAI client instance for API operations
 * @private Internal client, not exported
 */
const openai = new OpenAI()

/**
 * Process the embedding response
 * @internal
 */
export function processEmbeddingResponse(response: {
	data: Array<{ embedding: number[]; index: number; object: string }>
}) {
	return response.data[0] || { embedding: null }
}

/**
 * Generates an embedding vector for the given text using OpenAI's embeddings API
 *
 * @param text - The text to generate an embedding for
 * @returns The embedding data from OpenAI, or an object with null embedding if not found
 *
 * @example
 * ```ts
 * const result = await get_embedding('This is a sample text for embedding')
 * const vector = result.embedding
 * ```
 */
export async function get_embedding(text: string) {
	const embedding = await openai.embeddings.create({
		model: 'text-embedding-3-small',
		input: text,
		encoding_format: 'float',
	})

	return processEmbeddingResponse(embedding)
}

// For testing
get_embedding.processResponse = processEmbeddingResponse
