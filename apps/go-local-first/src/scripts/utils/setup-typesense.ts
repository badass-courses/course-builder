import crypto from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import dotenvFlow from 'dotenv-flow'
import Typesense, { type Client } from 'typesense'
import { type CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

let typesenseSchema: CollectionCreateSchema = {
	default_sorting_field: 'updated_at_timestamp',
	enable_nested_fields: true,
	name: 'content_production',
	fields: [
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'title',
			optional: false,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'type',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'auto',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'slug',
			optional: false,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'description',
			optional: false,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'visibility',
			optional: false,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'state',
			optional: false,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'published_at_timestamp',
			optional: true,
			sort: true,
			stem: false,
			store: true,
			type: 'int64',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'updated_at_timestamp',
			optional: false,
			sort: true,
			stem: false,
			store: true,
			type: 'int64',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: 'created_at_timestamp',
			optional: false,
			sort: true,
			stem: false,
			store: true,
			type: 'int64',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'type',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string',
		},
		{
			facet: false,
			index: true,
			infix: false,
			locale: '',
			name: '.*',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'auto',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'object[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.slug',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.name',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.createdAt',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.updatedAt',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.id',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.label',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.type',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.popularity_order',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'int64[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.url',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.description',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
		{
			facet: true,
			index: true,
			infix: false,
			locale: '',
			name: 'tags.fields.contexts',
			optional: true,
			sort: false,
			stem: false,
			store: true,
			type: 'string[]',
		},
	],
}

dotenvFlow.config()

const typesenseWriteClient = new Typesense.Client({
	nodes: [
		{
			host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
			port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT!),
			protocol: 'https',
		},
	],
	apiKey: process.env.TYPESENSE_WRITE_API_KEY!,
	connectionTimeoutSeconds: 2,
})

function createDatabaseHashString(databaseUrl: string) {
	return crypto.createHash('sha256').update(databaseUrl).digest('hex')
}

function checkDatabaseHashAgainstProduction(databaseHash: string) {
	const productionDatabaseHash = process.env.HASHED_PRODUCTION_DATABASE_URL
	return databaseHash === productionDatabaseHash
}

function createTypesenseDevCollection({
	name,
	typesenseSchema,
	typesenseWriteClient,
}: {
	name: string
	typesenseSchema: CollectionCreateSchema
	typesenseWriteClient: Client
}) {
	const devTypesenseSchema = {
		...typesenseSchema,
		name,
	}

	typesenseWriteClient.collections().create(devTypesenseSchema)
	console.log(`[typesense] Created dev collection: ${name}`)
}

function updateTypesenseCollectionNameOnFile(
	envPath: string,
	collectionName: string,
) {
	try {
		// Read the current env file content
		const currentContent = readFileSync(envPath, 'utf-8')

		// Split into lines and filter out any existing TYPESENSE_COLLECTION_NAME
		const lines = currentContent
			.split('\n')
			.filter((line) => !line.startsWith('TYPESENSE_COLLECTION_NAME='))
			.filter(Boolean) // Remove empty lines

		// Add the new collection name
		lines.push(`TYPESENSE_COLLECTION_NAME=${collectionName}`)

		// Write back to file with consistent line endings
		writeFileSync(envPath, lines.join('\n') + '\n')
		console.log(
			`[typesense] ${collectionName} set as TYPESENSE_COLLECTION_NAME`,
		)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			// If file doesn't exist, create it with just the collection name
			writeFileSync(envPath, `TYPESENSE_COLLECTION_NAME=${collectionName}\n`)
		} else {
			throw error
		}
	}
}

export async function setupDevEnvironment() {
	const DATABASE_URL = process.env.DATABASE_URL
	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL is not set')
	}
	const databaseHash = createDatabaseHashString(DATABASE_URL)
	const isProductionDatabase = checkDatabaseHashAgainstProduction(databaseHash)
	const envPath = path.join(process.cwd(), '.env.development.local')

	if (!isProductionDatabase) {
		try {
			const devCollectionName = `content_dev_${databaseHash}`

			try {
				await typesenseWriteClient.collections(devCollectionName).retrieve()
				console.log(
					`[typesense] Dev collection ${devCollectionName} already exists`,
				)
				updateTypesenseCollectionNameOnFile(envPath, devCollectionName)
			} catch (error) {
				createTypesenseDevCollection({
					name: devCollectionName,
					typesenseSchema,
					typesenseWriteClient,
				})

				updateTypesenseCollectionNameOnFile(envPath, devCollectionName)
			}
		} catch (error) {
			console.error('[typesense] Failed to setup dev environment:', error)
			throw error
		}
	} else {
		if (!process.env.TYPESENSE_COLLECTION_NAME) {
			throw new Error('TYPESENSE_COLLECTION_NAME is not set')
		}
		updateTypesenseCollectionNameOnFile(
			envPath,
			process.env.TYPESENSE_COLLECTION_NAME,
		)
		console.warn(
			'[typesense] ⚠️ Warning: Using production database! Be careful with any modifications.',
		)
	}
}
