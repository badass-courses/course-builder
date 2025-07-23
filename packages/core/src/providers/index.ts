import { AdapterUser } from '@auth/core/adapters'
import { EmailConfig } from '@auth/core/providers'
import { NodemailerConfig } from '@auth/core/providers/nodemailer'

import { Subscriber } from '../schemas/subscriber-schema'
import { CookieOption, PaymentsProviderConfig } from '../types'
import { LlmProviderConfig } from './openai'
import { PartyProviderConfig } from './partykit'
import { NotificationProviderConfig } from './slack'

export interface EmailListSubscribeOptions {
	listId?: string | number
	user: AdapterUser
	fields: Record<string, string>
	listType: string
}

export interface EmailListConfig {
	id: string
	name: string
	type: string
	options: EmailListConsumerConfig
	apiKey: string
	apiSecret: string
	defaultListType: string
	defaultListId?: number | string
	subscribeToList: (options: EmailListSubscribeOptions) => Promise<any>
	getSubscriber: (
		subscriberId: string | null | CookieOption,
	) => Promise<Subscriber | null>
	getSubscriberByEmail: (email: string) => Promise<Subscriber | null>
	tagSubscriber?: (options: {
		tag: string
		subscriberId: string
	}) => Promise<any>
	updateSubscriberFields?: (options: {
		fields: Record<string, string>
		subscriberId?: string
		subscriberEmail?: string
	}) => Promise<Subscriber | null>
}

export type EmailListConsumerConfig = Omit<
	Partial<EmailListConfig>,
	'options' | 'type'
> & {
	apiKey: string
	apiSecret: string
}

/**
 * The configuration object for a transcription service provider.
 */
export interface TranscriptionConfig {
	id: string
	name: string
	type: string
	options: TranscriptionUserConfig
	apiKey: string
	callbackUrl: string
	getCallbackUrl?: (options: {
		baseUrl: string
		params: Record<string, string>
	}) => string
	initiateTranscription: (options: {
		mediaUrl: string
		resourceId: string
	}) => Promise<any>
	handleCallback: (callbackData: any) => {
		srt: string
		transcript: string
		wordLevelSrt: string
	}
}

export const MockTranscriptionProvider: TranscriptionConfig = {
	id: 'mock-transcription' as const,
	name: 'Mock Transcription',
	type: 'transcription',
	options: {
		apiKey: 'mock-api-key',
		callbackUrl: 'mock-callback-url',
	},
	apiKey: 'mock-api-key',
	callbackUrl: 'mock-callback-url',
	getCallbackUrl: () => 'mock-callback-url',
	initiateTranscription: async () => ({ mock: 'transcription' }),
	handleCallback: () => ({
		srt: 'mock-srt',
		transcript: 'mock-transcript',
		wordLevelSrt: 'mock-word-level-srt',
	}),
}

export type TranscriptionUserConfig = Omit<
	Partial<TranscriptionConfig>,
	'options' | 'type'
> & {
	apiKey: string
	callbackUrl: string
}

/**
 * The configuration object for a search service provider.
 */
export interface SearchProviderConfig {
	id: string
	name: string
	type: 'search'
	options: SearchProviderConsumerConfig

	// Client configuration
	nodes: Array<{
		host: string
		port: number
		protocol: 'http' | 'https'
	}>
	apiKey: string
	writeApiKey?: string
	connectionTimeoutSeconds?: number
	defaultCollection?: string

	// Core operations
	upsertDocument(options: UpsertDocumentOptions): Promise<any>
	deleteDocument(options: DeleteDocumentOptions): Promise<void>
	searchDocuments(options: SearchDocumentOptions): Promise<SearchResults>
	vectorSearch(options: VectorSearchOptions): Promise<SearchResults>
	multiSearch(
		searches: Array<{
			collection: string
			q: string
			query_by?: string
			filter_by?: string
			vector_query?: string
			exclude_fields?: string
		}>,
	): Promise<{ results: SearchResults[] }>
	bulkIndex(options: BulkIndexOptions): Promise<void>

	// Collection management
	createCollection(options: CreateCollectionOptions): Promise<void>
	deleteCollection(collectionName: string): Promise<void>
	getCollection(collectionName: string): Promise<CollectionSchema>
}

export interface SearchProviderConsumerConfig {
	apiKey: string
	writeApiKey?: string
	nodes: Array<{
		host: string
		port: number
		protocol: 'http' | 'https'
	}>
	connectionTimeoutSeconds?: number
	defaultCollection?: string
}

export interface UpsertDocumentOptions {
	collectionName: string
	document: Record<string, any>
	id?: string
}

export interface DeleteDocumentOptions {
	collectionName: string
	documentId: string
}

export interface SearchDocumentOptions {
	collectionName: string
	query: string
	queryBy?: string
	filterBy?: string
	sortBy?: string
	facetBy?: string
	maxFacetValues?: number
	limit?: number
	offset?: number
	includeFields?: string
	excludeFields?: string
}

export interface VectorSearchOptions {
	collectionName: string
	vectorQuery: string
	k?: number
	distanceThreshold?: number
	filterBy?: string
	excludeFields?: string
}

export interface BulkIndexOptions {
	collectionName: string
	documents: Record<string, any>[]
	action?: 'create' | 'upsert' | 'update'
	batchSize?: number
}

export interface CreateCollectionOptions {
	name: string
	fields: Array<{
		name: string
		type: string
		facet?: boolean
		optional?: boolean
		index?: boolean
	}>
	default_sorting_field?: string
}

export interface SearchResults {
	hits: Array<{
		document: Record<string, any>
		text_match?: number
		text_match_info?: any
	}>
	found: number
	out_of: number
	page: number
	request_params: Record<string, any>
	search_time_ms: number
	facet_counts?: Array<{
		field_name: string
		counts: Array<{
			count: number
			highlighted: string
			value: string
		}>
	}>
}

export interface CollectionSchema {
	name: string
	num_documents: number
	fields: Array<{
		name: string
		type: string
		facet: boolean
		index: boolean
		optional: boolean
	}>
	default_sorting_field: string
	created_at: number
}

export type SearchProviderUserConfig = Omit<
	Partial<SearchProviderConfig>,
	'options' | 'type'
> & {
	apiKey: string
	nodes: Array<{
		host: string
		port: number
		protocol: 'http' | 'https'
	}>
}

/**
 * The user configuration object for a transcription service provider.
 */
export type ProviderType =
	| 'transcription'
	| 'email-list'
	| 'payment'
	| 'party'
	| 'checkout'
	| 'email'
	| 'notification'
	| 'search'

interface InternalProviderOptions {
	/** Used to deep merge user-provided config with the default config
	 */
	options?: Record<string, any>
}

export interface CommonProviderOptions {
	/**
	 * Uniquely identifies the provider in {@link CourseBuilderConfig.providers}.
	 * It's also part of the URL
	 */
	id: string
	/**
	 * The provider name used on the default sign-in page's sign-in button.
	 * For example if it's "Google", the corresponding button will say:
	 * "Sign in with Google"
	 */
	name: string
	/** See {@link ProviderType} */
	type: ProviderType
}

export type Provider<P = any> = (
	| ((
			| TranscriptionConfig
			| EmailListConfig
			| LlmProviderConfig
			| PartyProviderConfig
			| PaymentsProviderConfig
			| EmailConfig
			| NodemailerConfig
			| NotificationProviderConfig
			| SearchProviderConfig
	  ) &
			InternalProviderOptions)
	| ((
			...args: any
	  ) => (
			| TranscriptionConfig
			| EmailListConfig
			| LlmProviderConfig
			| PartyProviderConfig
			| PaymentsProviderConfig
			| EmailConfig
			| NodemailerConfig
			| NotificationProviderConfig
			| SearchProviderConfig
	  ) &
			InternalProviderOptions)
) &
	InternalProviderOptions
