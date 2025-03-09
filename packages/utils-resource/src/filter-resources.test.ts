import { describe, expect, it } from 'vitest'

import type { ContentResourceResource } from '@coursebuilder/core/dist/schemas/content-resource-schema'

import { filterResources } from './filter-resources'

describe('filterResources', () => {
	const createResource = (
		type: string,
		position: number,
		nestedResources: ContentResourceResource[] = [],
	): ContentResourceResource => ({
		resourceId: `resource-${type}-${position}`,
		resourceOfId: `resource-of-${type}-${position}`,
		position,
		metadata: null,
		createdAt: null,
		updatedAt: null,
		deletedAt: null,
		resource: {
			id: `resource-${type}-${position}`,
			type,
			resources: nestedResources,
		},
	})

	it('should filter out videoResource by default', () => {
		const resources: ContentResourceResource[] = [
			createResource('module', 0),
			createResource('videoResource', 1),
			createResource('module', 2),
		]

		const result = filterResources(resources)

		expect(result).toHaveLength(2)
		expect(result[0].resource.type).toBe('module')
		expect(result[1].resource.type).toBe('module')
		expect(result[0].position).toBe(0)
		expect(result[1].position).toBe(1) // Position updated
	})

	it('should filter out specified resource types', () => {
		const resources: ContentResourceResource[] = [
			createResource('module', 0),
			createResource('videoResource', 1),
			createResource('linkResource', 2),
			createResource('module', 3),
		]

		const result = filterResources(resources, ['videoResource', 'linkResource'])

		expect(result).toHaveLength(2)
		expect(result[0].resource.type).toBe('module')
		expect(result[1].resource.type).toBe('module')
	})

	it('should filter resources recursively', () => {
		const nestedResources: ContentResourceResource[] = [
			createResource('module', 0),
			createResource('videoResource', 1),
		]

		const resources: ContentResourceResource[] = [
			createResource('module', 0, nestedResources),
			createResource('videoResource', 1),
		]

		const result = filterResources(resources)

		expect(result).toHaveLength(1)
		expect(result[0].resource.type).toBe('module')
		expect(result[0].resource.resources).toHaveLength(1)
		expect(result[0].resource.resources[0].resource.type).toBe('module')
	})

	it('should handle a single string as removeTypes', () => {
		const resources: ContentResourceResource[] = [
			createResource('module', 0),
			createResource('videoResource', 1),
			createResource('linkResource', 2),
		]

		const result = filterResources(resources, 'videoResource')

		expect(result).toHaveLength(2)
		expect(result[0].resource.type).toBe('module')
		expect(result[1].resource.type).toBe('linkResource')
	})

	it('should handle empty resources', () => {
		expect(filterResources([])).toEqual([])
		expect(filterResources(null)).toEqual([])
		expect(filterResources(undefined)).toEqual([])
	})

	it('should ensure all resources have a resources array', () => {
		const resources: ContentResourceResource[] = [
			{
				resourceId: 'test-resource-id',
				resourceOfId: 'test-parent-id',
				position: 0,
				metadata: null,
				createdAt: null,
				updatedAt: null,
				deletedAt: null,
				resource: {
					id: 'resource-without-resources',
					type: 'module',
					// No resources array
				},
			},
		]

		const result = filterResources(resources)

		expect(result).toHaveLength(1)
		expect(result[0].resource.resources).toEqual([])
	})

	it('should update positions correctly', () => {
		const resources: ContentResourceResource[] = [
			createResource('module', 10),
			createResource('videoResource', 20),
			createResource('module', 30),
		]

		const result = filterResources(resources)

		expect(result).toHaveLength(2)
		expect(result[0].position).toBe(0)
		expect(result[1].position).toBe(1)
	})
})
