import { describe, expect, it, vi } from 'vitest'

import {
	createDefaultConfig,
	createTypesenseAdapter,
	getTypesenseCollectionName,
	type TypesenseAdapterConfig,
} from './typesense-adapter'

// Mock TypesenseInstantSearchAdapter
vi.mock('typesense-instantsearch-adapter', () => {
	return {
		default: class MockTypesenseInstantSearchAdapter {
			constructor(public config: TypesenseAdapterConfig) {}
		},
	}
})

describe('typesense-adapter utilities', () => {
	describe('createTypesenseAdapter', () => {
		it('should create an adapter with the provided config', () => {
			const config = {
				server: {
					apiKey: 'test-key',
					nodes: [
						{ host: 'test-host', port: 8108, protocol: 'https', path: '' },
					],
				},
				additionalSearchParameters: {
					query_by: 'title,description',
				},
			}

			const adapter = createTypesenseAdapter(config)
			expect(adapter).toBeDefined()
			expect(adapter.config).toEqual(config)
		})
	})

	describe('createDefaultConfig', () => {
		it('should create a config with default values', () => {
			const config = createDefaultConfig()

			expect(config).toEqual({
				server: {
					apiKey: '',
					nodes: [
						{
							host: 'localhost',
							path: '',
							port: 8108,
							protocol: 'https',
						},
					],
					cacheSearchResultsForSeconds: 2 * 60,
				},
				additionalSearchParameters: {
					query_by: 'title,description',
					preset: 'updated_at_timestamp',
				},
			})
		})

		it('should create a config with custom values', () => {
			const config = createDefaultConfig({
				apiKey: 'custom-key',
				host: 'custom-host',
				port: 9000,
				protocol: 'http',
				queryBy: 'title,summary',
				preset: 'custom_preset',
				sortBy: '_text_match:desc',
			})

			expect(config).toEqual({
				server: {
					apiKey: 'custom-key',
					nodes: [
						{
							host: 'custom-host',
							path: '',
							port: 9000,
							protocol: 'http',
						},
					],
					cacheSearchResultsForSeconds: 2 * 60,
				},
				additionalSearchParameters: {
					query_by: 'title,summary',
					preset: 'custom_preset',
					sort_by: '_text_match:desc',
				},
			})
		})
	})

	describe('getTypesenseCollectionName', () => {
		const originalEnv = { ...process.env }

		it('should return default collection name when env var is not set', () => {
			delete process.env.TYPESENSE_COLLECTION_NAME

			const collectionName = getTypesenseCollectionName()
			expect(collectionName).toBe('content_production')
		})

		it('should return value from env var when it exists', () => {
			process.env.TYPESENSE_COLLECTION_NAME = 'test_collection'

			const collectionName = getTypesenseCollectionName()
			expect(collectionName).toBe('test_collection')
		})

		it('should use custom env var name if provided', () => {
			process.env.CUSTOM_COLLECTION_NAME = 'custom_collection'

			const collectionName = getTypesenseCollectionName({
				envVar: 'CUSTOM_COLLECTION_NAME',
			})
			expect(collectionName).toBe('custom_collection')
		})

		it('should use custom default value if provided', () => {
			delete process.env.TYPESENSE_COLLECTION_NAME

			const collectionName = getTypesenseCollectionName({
				defaultValue: 'fallback_collection',
			})
			expect(collectionName).toBe('fallback_collection')
		})
	})
})
