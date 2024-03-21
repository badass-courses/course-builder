import {
	CreateIndexOptions,
	Index,
	Pinecone,
} from '@pinecone-database/pinecone'
import { PineconeConflictError } from '@pinecone-database/pinecone/dist/errors'

const pc = new Pinecone()

export async function get_or_create_index(
	opts: CreateIndexOptions,
): Promise<Index> {
	try {
		await pc.createIndex(opts)
	} catch (e) {
		console.log(
			'Error creating new index with name ' +
				opts.name +
				'. This is expected if the index already exists. The error is as follows: ' +
				(e as Error).message,
		)
	}

	const index: Index = await pc.index(opts.name)
	return index
}

export async function get_index(name: string) {
	return await pc.index(name)
}
