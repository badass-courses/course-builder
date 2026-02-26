import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { transformWorkshopToModuleSchema } from './transform-workshop-result'

describe('transformWorkshopToModuleSchema', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns null resources when workshop has no transformable children', () => {
		const result = transformWorkshopToModuleSchema({
			id: 'workshop-1',
			type: 'workshop',
			fields: { slug: 'workshop-1' },
			resources: [],
		})

		expect(result).toEqual({ resources: null })
	})

	it('marks lessons with solutions as exercises', () => {
		const result = transformWorkshopToModuleSchema({
			id: 'workshop-2',
			type: 'workshop',
			fields: { slug: 'workshop-2' },
			resources: [
				{
					resourceId: 'lesson-1',
					position: 0,
					resource: {
						id: 'lesson-1',
						type: 'lesson',
						fields: { slug: 'lesson-1' },
						resources: [
							{
								resourceId: 'solution-1',
								position: 0,
								resource: {
									id: 'solution-1',
									type: 'solution',
									fields: { slug: 'solution-1' },
								},
							},
						],
					},
				},
			],
		})

		expect(result).toEqual({
			resources: [
				{
					_type: 'exercise',
					_id: 'lesson-1',
					slug: 'lesson-1',
				},
			],
		})
	})

	it('falls back to resource id when slug is missing', () => {
		const result = transformWorkshopToModuleSchema({
			id: 'workshop-3',
			type: 'workshop',
			fields: { slug: 'workshop-3' },
			resources: [
				{
					resourceId: 'section-1',
					position: 0,
					resource: {
						id: 'section-1',
						type: 'section',
						fields: {},
						resources: [
							{
								resourceId: 'lesson-2',
								position: 0,
								resource: {
									id: 'lesson-2',
									type: 'lesson',
									fields: {},
									resources: [],
								},
							},
						],
					},
				},
			],
		})

		expect(result).toEqual({
			resources: [
				{
					_type: 'section',
					_id: 'section-1',
					slug: 'section-1',
					lessons: [
						{
							_type: 'lesson',
							_id: 'lesson-2',
							slug: 'lesson-2',
						},
					],
				},
			],
		})

		expect(console.warn).toHaveBeenCalled()
	})

	it('handles mixed top-level section and standalone lesson resources', () => {
		const result = transformWorkshopToModuleSchema({
			id: 'workshop-4',
			type: 'workshop',
			fields: { slug: 'workshop-4' },
			resources: [
				{
					resourceId: 'section-mixed',
					position: 0,
					resource: {
						id: 'section-mixed',
						type: 'section',
						fields: {},
						resources: [
							{
								resourceId: 'section-lesson-1',
								position: 0,
								resource: {
									id: 'section-lesson-1',
									type: 'lesson',
									fields: { slug: 'section-lesson-1' },
									resources: [],
								},
							},
						],
					},
				},
				{
					resourceId: 'standalone-lesson',
					position: 1,
					resource: {
						id: 'standalone-lesson',
						type: 'lesson',
						fields: {},
						resources: [],
					},
				},
			],
		})

		expect(result).toEqual({
			resources: [
				{
					_type: 'section',
					_id: 'section-mixed',
					slug: 'section-mixed',
					lessons: [
						{
							_type: 'lesson',
							_id: 'section-lesson-1',
							slug: 'section-lesson-1',
						},
					],
				},
				{
					_type: 'lesson',
					_id: 'standalone-lesson',
					slug: 'standalone-lesson',
				},
			],
		})

		expect(console.warn).toHaveBeenCalledTimes(2)
		expect(console.warn).toHaveBeenNthCalledWith(
			1,
			'transformWorkshopToModuleSchema: missing slug, using resource id fallback',
			{
				resourceId: 'section-mixed',
				resourceType: 'section',
			},
		)
		expect(console.warn).toHaveBeenNthCalledWith(
			2,
			'transformWorkshopToModuleSchema: missing slug, using resource id fallback',
			{
				resourceId: 'standalone-lesson',
				resourceType: 'lesson',
			},
		)
	})
})
