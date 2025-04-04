import { env } from '@/env.mjs'
import {
	CreateIndexOptions,
	Index,
	Pinecone,
} from '@pinecone-database/pinecone'

export async function get_or_create_index(
	opts: CreateIndexOptions,
): Promise<Index | undefined> {
	if (env.PINECONE_API_KEY !== undefined) {
		try {
			const pc = new Pinecone()
			const { indexes = [] } = await pc.listIndexes()
			for (const indexModel of indexes) {
				if (indexModel.name === opts.name) {
					return await pc.index(opts.name)
				}
			}
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
		} catch (e) {
			console.debug('Error getting or creating index: ' + (e as Error).message)
		}
	}
}

export async function get_index(name: string) {
	try {
		const pc = new Pinecone()
		return await pc.index(name)
	} catch (e) {
		console.debug('Error getting index: ' + (e as Error).message)
	}
}
