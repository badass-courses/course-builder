import fs from 'node:fs/promises'
import {
	Document,
	IngestionPipeline,
	MarkdownNodeParser,
	OpenAI,
	OpenAIEmbedding,
	PineconeVectorStore,
	RouterQueryEngine,
	serviceContextFromDefaults,
	storageContextFromDefaults,
	SummaryIndex,
	TitleExtractor,
	VectorStoreIndex,
} from 'llamaindex'

import { get_or_create_index } from '../pinecone'

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

// note we are using 10k-token chunks with the assumptioon that we have a large context window
const vectorStore = new PineconeVectorStore({
	chunkSize: 10000,
	indexName: 'rag',
})

const nodeParser = new MarkdownNodeParser()

const storageContext = await storageContextFromDefaults({
	vectorStore,
})

const serviceContext = serviceContextFromDefaults({
	nodeParser,
	llm: new OpenAI({
		model: 'gpt-4-0125-preview',
	}),
	embedModel: new OpenAIEmbedding(),
})

export async function ingest(source_filename: string) {
	const path = '../../rag-inputs/' + source_filename
	const docs = await load_database_dump(path, source_filename)

	const pipeline = new IngestionPipeline({
		transformations: [nodeParser, new TitleExtractor(), new OpenAIEmbedding()],
		vectorStore,
		docStore: storageContext.docStore,
	})

	const nodes = await pipeline.run({
		documents: docs,
	})

	const vectorIndex = await VectorStoreIndex.fromVectorStore(
		vectorStore,
		serviceContext,
	)

	const summaryIndex = await SummaryIndex.init({
		nodes,
		serviceContext,
		storageContext,
	})

	const vectorQueryEngine = vectorIndex.asQueryEngine()
	const summaryQueryEngine = summaryIndex.asQueryEngine()

	const queryEngine = RouterQueryEngine.fromDefaults({
		queryEngineTools: [
			{
				queryEngine: vectorQueryEngine,
				description:
					'Useful foor getting specific context from documents ingested',
			},
			{
				queryEngine: summaryQueryEngine,
				description: 'Useful for summarizing the documents ingested',
			},
		],
		serviceContext,
	})

	return queryEngine
}

type ContentRecord = {
	title: string
	body: string
	summary: string
	slug: {
		current: string
	}
}

const load_database_dump = async (
	path: string,
	source_key: string,
): Promise<Document[]> => {
	const raw_source = await fs.readFile(path, 'utf-8')
	const source = JSON.parse(raw_source)
	const docs: Document[] = []

	source.result.forEach((item: ContentRecord) => {
		docs.push(
			new Document({
				text: item.title + '\n\n' + item.body,
				id_: item.slug.current,
				metadata: {
					source: source_key,
				},
			}),
		)
	})

	return docs
}
