import {
	BaseQueryEngine,
	Document,
	IngestionPipeline,
	MarkdownNodeParser,
	OpenAI,
	OpenAIEmbedding,
	PineconeVectorStore,
	RetrieverQueryEngine,
	serviceContextFromDefaults,
	storageContextFromDefaults,
	TitleExtractor,
	VectorStoreIndex,
} from 'llamaindex'

import { get_or_create_index } from '../pinecone'

// this file is used both for our one-off ingestion operations
// and for our usage within the server.
// we want to grab a reference to our pinecone backing store, and then use that for both operations.

// this function will grab our backing store and feed it some new data
// it needs to parse the data and inject it into the backing store,
// and it needs to somehow invalidate existing index and query engines.
// this method will be called by migrations/rag/ingest_database_exports.ts
export async function ingestDatabaseDump(url: string) {
	const docs = await load_database_dump(url)
	await ingest(docs)
	console.log('Ingestion complete!')
}

// this should get or create a query engine. Once called we should cache the query engine
// unless additional data is injected.
let query_engine: (BaseQueryEngine & RetrieverQueryEngine) | null = null
export async function getQueryEngine(
	force_fresh_query_engine: boolean = false,
): Promise<BaseQueryEngine & RetrieverQueryEngine> {
	if (force_fresh_query_engine) {
		await invalidate_query_engine()
	}

	if (!query_engine) {
		await regenerate_query_engine()
	}

	if (!query_engine) {
		throw new Error('Unable to initialize RAG Query Engine!')
	}

	return query_engine
}

// internal stuff
// make sure we have our pinecone index created, this is separate from our Concepts index
// (maybe we want to use only one index and rely on namespaces?)
await get_or_create_index({
	name: 'rag',
	dimension: 1536,
	metric: 'cosine',
	spec: {
		serverless: {
			cloud: 'aws',
			region: 'us-west-2',
		},
	},
})

const vectorStore = new PineconeVectorStore({
	chunkSize: 250,
	indexName: 'rag',
})

const nodeParser = new MarkdownNodeParser({
	includeMetadata: true,
	includePrevNextRel: true,
})

const storageContext = await storageContextFromDefaults({
	vectorStore,
})

const serviceContext = serviceContextFromDefaults({
	nodeParser,
	llm: new OpenAI({
		model: 'gpt-4-0125-preview',
	}),
	embedModel: new OpenAIEmbedding(),
	chunkSize: 250,
	chunkOverlap: 25,
})

async function ingest(docs: Document[], overwrite: boolean = true) {
	const pipeline = new IngestionPipeline({
		transformations: [nodeParser, new TitleExtractor(), new OpenAIEmbedding()],
		vectorStore,
		docStore: storageContext.docStore,
	})

	if (overwrite) {
		// let's go through and erase prior data related to the documents we are currently loading
		const new_ids = docs.map((doc) => doc.id_)
		for (const id in new_ids) {
			console.log(
				'\tdeleting records associated with id <' +
					id +
					'> from backing store...',
			)
			try {
				await vectorStore.delete(id)
				console.log('\t\t...done')
			} catch (e) {
				// this is fine
			}
		}
	}

	const nodes = await pipeline.run({
		documents: docs,
	})

	console.log('ingested ' + nodes.length + ' nodes into vector store')

	invalidate_query_engine()
	regenerate_query_engine()
}

function invalidate_query_engine() {
	query_engine = null
}

async function regenerate_query_engine() {
	const vector_index = await VectorStoreIndex.fromVectorStore(
		vectorStore,
		serviceContext,
	)

	query_engine = vector_index.asQueryEngine()
}

type DatabaseDump = {
	result: ContentRecord[]
}

type ContentRecord = {
	title: string
	body: string
	summary: string
	slug: {
		current: string
	}
}

const load_database_dump = async (url: string): Promise<Document[]> => {
	const json: DatabaseDump = await (await fetch(url)).json()
	const docs: Document[] = []

	json.result.forEach((item: ContentRecord) => {
		docs.push(
			new Document({
				text: item.title + '\n\n' + item.body,
				id_: item.slug.current,
				metadata: {
					source: url,
				},
			}),
		)
	})

	return docs
}
