import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getResourcePath, ResourceContext } from './resource-paths'

describe('getResourcePath', () => {
	// Suppress console.warn for tests
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('basic resource types', () => {
		test('should generate event paths', () => {
			expect(getResourcePath('event', 'my-event')).toBe('/events/my-event')
			expect(getResourcePath('event', 'my-event', 'edit')).toBe(
				'/events/my-event/edit',
			)
		})

		test('should generate event-series paths', () => {
			expect(getResourcePath('event-series', 'my-series')).toBe(
				'/events/my-series',
			)
			expect(getResourcePath('event-series', 'my-series', 'edit')).toBe(
				'/events/my-series/edit',
			)
		})

		test('should generate post paths', () => {
			expect(getResourcePath('post', 'my-post')).toBe('/my-post')
			expect(getResourcePath('post', 'my-post', 'edit')).toBe(
				'/posts/my-post/edit',
			)
		})

		test('should generate article paths', () => {
			expect(getResourcePath('article', 'my-article')).toBe('/my-article')
			expect(getResourcePath('article', 'my-article', 'edit')).toBe(
				'/posts/my-article/edit',
			)
		})

		test('should generate tip paths', () => {
			expect(getResourcePath('tip', 'my-tip')).toBe('/my-tip')
			expect(getResourcePath('tip', 'my-tip', 'edit')).toBe(
				'/posts/my-tip/edit',
			)
		})

		test('should generate workshop paths', () => {
			expect(getResourcePath('workshop', 'my-workshop')).toBe(
				'/workshops/my-workshop',
			)
			expect(getResourcePath('workshop', 'my-workshop', 'edit')).toBe(
				'/workshops/my-workshop/edit',
			)
		})

		test('should generate tutorial paths', () => {
			expect(getResourcePath('tutorial', 'my-tutorial')).toBe('/my-tutorial')
			expect(getResourcePath('tutorial', 'my-tutorial', 'edit')).toBe(
				'/lists/my-tutorial/edit',
			)
		})

		test('should generate list paths', () => {
			expect(getResourcePath('list', 'my-list')).toBe('/my-list')
			expect(getResourcePath('list', 'my-list', 'edit')).toBe(
				'/lists/my-list/edit',
			)
		})

		test('should generate cohort paths', () => {
			expect(getResourcePath('cohort', 'my-cohort')).toBe('/cohorts/my-cohort')
			expect(getResourcePath('cohort', 'my-cohort', 'edit')).toBe(
				'/cohorts/my-cohort/edit',
			)
		})

		test('should generate section paths (empty)', () => {
			expect(getResourcePath('section', 'my-section')).toBe('')
			expect(getResourcePath('section', 'my-section', 'edit')).toBe('')
		})
	})

	describe('lesson paths with context', () => {
		test('should generate standalone lesson paths', () => {
			expect(getResourcePath('lesson', 'my-lesson')).toBe('/my-lesson')
			expect(getResourcePath('lesson', 'my-lesson', 'edit')).toBe(
				'/posts/my-lesson/edit',
			)
		})

		test('should generate workshop lesson paths with context', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: 'workshop-slug',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/workshops/workshop-slug/lesson-slug',
			)
			expect(getResourcePath('lesson', 'lesson-slug', 'edit', context)).toBe(
				'/workshops/workshop-slug/lesson-slug/edit',
			)
		})

		test('should generate workshop lesson paths with getParentSlug function', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: '',
				getParentSlug: () => 'dynamic-workshop-slug',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/workshops/dynamic-workshop-slug/lesson-slug',
			)
			expect(getResourcePath('lesson', 'lesson-slug', 'edit', context)).toBe(
				'/workshops/dynamic-workshop-slug/lesson-slug/edit',
			)
		})

		test('should handle missing workshop parent slug', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: '',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/lessons/lesson-slug',
			)
			expect(getResourcePath('lesson', 'lesson-slug', 'edit', context)).toBe(
				'/lessons/lesson-slug/edit',
			)
			expect(console.warn).toHaveBeenCalledWith(
				'No parent slug found for workshop lesson',
			)
		})

		test('should generate list lesson paths with context', () => {
			const context: ResourceContext = {
				parentType: 'list',
				parentSlug: 'list-slug',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/lesson-slug',
			)
			expect(getResourcePath('lesson', 'lesson-slug', 'edit', context)).toBe(
				'/posts/lesson-slug/edit',
			)
		})

		test('should handle missing list parent slug', () => {
			const context: ResourceContext = {
				parentType: 'list',
				parentSlug: '',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/lesson-slug',
			)
			expect(getResourcePath('lesson', 'lesson-slug', 'edit', context)).toBe(
				'/lesson-slug/edit',
			)
			expect(console.warn).toHaveBeenCalledWith(
				'No parent slug found for list lesson',
			)
		})
	})

	describe('solution paths with context', () => {
		test('should generate standalone solution paths', () => {
			expect(getResourcePath('solution', 'my-solution')).toBe('/my-solution')
			expect(getResourcePath('solution', 'my-solution', 'edit')).toBe(
				'/posts/my-solution/edit',
			)
		})

		test('should generate workshop solution paths with context', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: 'workshop-slug',
			}

			expect(
				getResourcePath('solution', 'solution-slug', 'view', context),
			).toBe('/workshops/workshop-slug/solution-slug/solution')
			expect(
				getResourcePath('solution', 'solution-slug', 'edit', context),
			).toBe('/workshops/workshop-slug/solution-slug/solution/edit')
		})

		test('should generate workshop solution paths with getParentSlug function', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: '',
				getParentSlug: () => 'dynamic-workshop-slug',
			}

			expect(
				getResourcePath('solution', 'solution-slug', 'view', context),
			).toBe('/workshops/dynamic-workshop-slug/solution-slug/solution')
			expect(
				getResourcePath('solution', 'solution-slug', 'edit', context),
			).toBe('/workshops/dynamic-workshop-slug/solution-slug/solution/edit')
		})

		test('should handle missing workshop parent slug for solution', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: '',
			}

			expect(
				getResourcePath('solution', 'solution-slug', 'view', context),
			).toBe('/solution-slug')
			expect(
				getResourcePath('solution', 'solution-slug', 'edit', context),
			).toBe('/posts/solution-slug/edit')
			expect(console.warn).toHaveBeenCalledWith(
				'No parent slug found for workshop lesson',
			)
		})
	})

	describe('fallback behavior', () => {
		test('should handle unknown resource types', () => {
			expect(getResourcePath('unknown-type', 'test-slug')).toBe(
				'/unknown-type/test-slug',
			)
			expect(getResourcePath('unknown-type', 'test-slug', 'edit')).toBe(
				'/unknown-type/test-slug/edit',
			)
			expect(console.warn).toHaveBeenCalledWith(
				'Unknown resource type: unknown-type, falling back to /unknown-type/test-slug',
			)
		})

		test('should use view mode by default', () => {
			expect(getResourcePath('post', 'test-post')).toBe('/test-post')
		})
	})

	describe('edge cases', () => {
		test('should handle empty slugs', () => {
			expect(getResourcePath('post', '')).toBe('/')
			expect(getResourcePath('workshop', '', 'edit')).toBe('/workshops//edit')
		})

		test('should handle special characters in slugs', () => {
			expect(getResourcePath('post', 'my-post-123')).toBe('/my-post-123')
			expect(getResourcePath('workshop', 'workshop_with_underscores')).toBe(
				'/workshops/workshop_with_underscores',
			)
		})

		test('should handle context with both parentSlug and getParentSlug', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: 'static-slug',
				getParentSlug: () => 'dynamic-slug',
			}

			// Should prefer parentSlug over getParentSlug when both are present
			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/workshops/static-slug/lesson-slug',
			)
		})

		test('should handle getParentSlug returning empty string', () => {
			const context: ResourceContext = {
				parentType: 'workshop',
				parentSlug: '',
				getParentSlug: () => '',
			}

			expect(getResourcePath('lesson', 'lesson-slug', 'view', context)).toBe(
				'/lessons/lesson-slug',
			)
			expect(console.warn).toHaveBeenCalledWith(
				'No parent slug found for workshop lesson',
			)
		})
	})
})
