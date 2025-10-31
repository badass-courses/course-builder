import { describe, expect, it } from 'vitest'

import type { ContentResource } from '@coursebuilder/core/schemas'

import {
	findParentLessonForSolution,
	findSectionIdForResourceSlug,
	flattenNavigationResources,
	getFirstResourceSlug,
	type Level1ResourceWrapper,
	type Level2ResourceWrapper,
	type ResourceNavigation,
} from './content-navigation'

const now = new Date()

/**
 * Helper to create a minimal ContentResource
 */
function createResource(
	overrides: Partial<ContentResource> & {
		id: string
		type: string
		fields?: { slug?: string | null; title?: string }
	},
): ContentResource {
	const { type, id, ...restOverrides } = overrides
	return {
		id,
		type,
		createdById: restOverrides.createdById || 'user-1',
		createdAt: restOverrides.createdAt || now,
		updatedAt: restOverrides.updatedAt || now,
		deletedAt: restOverrides.deletedAt || null,
		organizationId: restOverrides.organizationId || null,
		createdByOrganizationMembershipId:
			restOverrides.createdByOrganizationMembershipId || null,
		fields: restOverrides.fields || {},
		resources: restOverrides.resources || null,
		...restOverrides,
	} as ContentResource
}

/**
 * Helper to create a Level1ResourceWrapper (top-level resource)
 */
function createLevel1Wrapper(
	resource: ContentResource,
	resources?: Level2ResourceWrapper[] | any[] | null,
): Level1ResourceWrapper {
	return {
		resourceId: resource.id,
		resourceOfId: 'workshop-id',
		position: 0,
		metadata: {},
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		resource: {
			...resource,
			resources: resources || null,
		},
	} as Level1ResourceWrapper
}

/**
 * Helper to create a Level2ResourceWrapper (nested in section)
 */
function createLevel2Wrapper(
	resource: ContentResource,
	resources?: any[] | null,
): Level2ResourceWrapper {
	return {
		resourceId: resource.id,
		resourceOfId: 'section-id',
		position: 0,
		metadata: {},
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		resource: {
			...resource,
			resources: resources || null,
		},
	} as Level2ResourceWrapper
}

/**
 * Helper to create a Level3ResourceWrapper (solution nested in lesson)
 */
function createLevel3Wrapper(resource: ContentResource): {
	resource: ContentResource
	resourceId: string
	resourceOfId: string
	position: number
	metadata: Record<string, any>
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
} {
	return {
		resourceId: resource.id,
		resourceOfId: 'lesson-id',
		position: 0,
		metadata: {},
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		resource,
	}
}

/**
 * Helper to create a ResourceNavigation
 */
function createNavigation(
	resources: Level1ResourceWrapper[] | null | undefined,
): ResourceNavigation {
	return {
		id: 'workshop-id',
		type: 'workshop',
		createdById: 'user-1',
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		organizationId: null,
		createdByOrganizationMembershipId: null,
		fields: { slug: 'test-workshop', title: 'Test Workshop' },
		resources: resources || null,
	} as ResourceNavigation
}

describe('content-navigation', () => {
	describe('findSectionIdForResourceSlug', () => {
		it('returns section ID when resource slug is found in a section', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBe(
				'section-1',
			)
		})

		it('returns null for top-level resources', () => {
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(lesson)])

			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBeNull()
		})

		it('returns null when navigation is null', () => {
			expect(findSectionIdForResourceSlug(null, 'lesson-1')).toBeNull()
		})

		it('returns null when resource slug is not found', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(
				findSectionIdForResourceSlug(navigation, 'non-existent'),
			).toBeNull()
		})

		it('returns null when resource slug is null', () => {
			const navigation = createNavigation([])
			expect(findSectionIdForResourceSlug(navigation, null)).toBeNull()
		})

		it('returns null when resource slug is undefined', () => {
			const navigation = createNavigation([])
			expect(findSectionIdForResourceSlug(navigation, undefined)).toBeNull()
		})

		it('handles multiple sections correctly', () => {
			const section1 = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const section2 = createResource({
				id: 'section-2',
				type: 'section',
				fields: { slug: 'section-2', title: 'Section 2' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section1, [createLevel2Wrapper(lesson1)]),
				createLevel1Wrapper(section2, [createLevel2Wrapper(lesson2)]),
			])

			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBe(
				'section-1',
			)
			expect(findSectionIdForResourceSlug(navigation, 'lesson-2')).toBe(
				'section-2',
			)
		})

		it('handles sections with no resources', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(section, [])])

			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBeNull()
		})

		it('handles duplicate slugs (should return first match)', () => {
			const section1 = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const section2 = createResource({
				id: 'section-2',
				type: 'section',
				fields: { slug: 'section-2', title: 'Section 2' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'duplicate-slug', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'duplicate-slug', title: 'Lesson 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section1, [createLevel2Wrapper(lesson1)]),
				createLevel1Wrapper(section2, [createLevel2Wrapper(lesson2)]),
			])

			expect(findSectionIdForResourceSlug(navigation, 'duplicate-slug')).toBe(
				'section-1',
			)
		})

		it('handles resources with null slug', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: null, title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(findSectionIdForResourceSlug(navigation, null)).toBeNull()
		})

		it('handles empty resources array', () => {
			const navigation = createNavigation([])
			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBeNull()
		})

		it('handles navigation with null resources', () => {
			const navigation = createNavigation(null)
			expect(findSectionIdForResourceSlug(navigation, 'lesson-1')).toBeNull()
		})
	})

	describe('getFirstResourceSlug', () => {
		it('returns first non-section resource slug', () => {
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(lesson)])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})

		it('skips sections and returns first actual content slug', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})

		it('returns null when navigation is empty', () => {
			const navigation = createNavigation([])
			expect(getFirstResourceSlug(navigation)).toBeNull()
		})

		it('returns null when navigation is null', () => {
			expect(getFirstResourceSlug(null)).toBeNull()
		})

		it('handles nested structures correctly', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [createLevel3Wrapper(solution)]),
				]),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})

		it('handles workshop with only sections (no direct lessons)', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})

		it('handles workshop with only top-level lessons (no sections)', () => {
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(lesson1),
				createLevel1Wrapper(lesson2),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})

		it('handles resources with missing slugs', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: null, title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson1),
					createLevel2Wrapper(lesson2),
				]),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-2')
		})

		it('returns null when all resources have null slugs', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: null, title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(getFirstResourceSlug(navigation)).toBeNull()
		})

		it('handles navigation with null resources', () => {
			const navigation = createNavigation(null)
			expect(getFirstResourceSlug(navigation)).toBeNull()
		})

		it('handles empty sections', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, []),
				createLevel1Wrapper(lesson),
			])

			expect(getFirstResourceSlug(navigation)).toBe('lesson-1')
		})
	})

	describe('flattenNavigationResources', () => {
		it('flattens all resources from nested structure', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened).toHaveLength(1)
			expect(flattened[0]?.id).toBe('lesson-1')
		})

		it('skips sections in output', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened.every((r) => r.type !== 'section')).toBe(true)
		})

		it('returns empty array when navigation is null', () => {
			expect(flattenNavigationResources(null)).toEqual([])
		})

		it('returns empty array when navigation is empty', () => {
			const navigation = createNavigation([])
			expect(flattenNavigationResources(navigation)).toEqual([])
		})

		it('preserves order of resources', () => {
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})
			const lesson3 = createResource({
				id: 'lesson-3',
				type: 'lesson',
				fields: { slug: 'lesson-3', title: 'Lesson 3' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(lesson1),
				createLevel1Wrapper(lesson2),
				createLevel1Wrapper(lesson3),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened.map((r) => r.id)).toEqual([
				'lesson-1',
				'lesson-2',
				'lesson-3',
			])
		})

		it('handles deep nesting (section > lesson > solution)', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [createLevel3Wrapper(solution)]),
				]),
			])

			const flattened = flattenNavigationResources(navigation)
			// flattenNavigationResources now includes solutions nested within lessons
			expect(flattened).toHaveLength(2)
			expect(flattened[0]?.id).toBe('lesson-1')
			expect(flattened[1]?.id).toBe('solution-1')
			expect(flattened[1]?.type).toBe('solution')
		})

		it('includes solutions when recursing into lesson resources', () => {
			// Verify that flattenNavigationResources now includes solutions
			// nested within lessons
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(lesson, [createLevel3Wrapper(solution)]),
			])

			const flattened = flattenNavigationResources(navigation)
			// Should include both the lesson and its nested solution
			expect(flattened).toHaveLength(2)
			expect(flattened[0]?.id).toBe('lesson-1')
			expect(flattened[0]?.type).toBe('lesson')
			expect(flattened[1]?.id).toBe('solution-1')
			expect(flattened[1]?.type).toBe('solution')
		})

		it('handles mixed structures (sections and top-level lessons)', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson1)]),
				createLevel1Wrapper(lesson2),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened).toHaveLength(2)
			expect(flattened[0]?.id).toBe('lesson-1')
			expect(flattened[1]?.id).toBe('lesson-2')
		})

		it('handles empty sections', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, []),
				createLevel1Wrapper(lesson),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened).toHaveLength(1)
			expect(flattened[0]?.id).toBe('lesson-1')
		})

		it('handles navigation with null resources', () => {
			const navigation = createNavigation(null)
			expect(flattenNavigationResources(navigation)).toEqual([])
		})

		it('handles resources with null resources array', () => {
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(lesson, null)])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened).toHaveLength(1)
			expect(flattened[0]?.id).toBe('lesson-1')
		})

		it('handles multiple sections with multiple lessons', () => {
			const section1 = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const section2 = createResource({
				id: 'section-2',
				type: 'section',
				fields: { slug: 'section-2', title: 'Section 2' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})
			const lesson3 = createResource({
				id: 'lesson-3',
				type: 'lesson',
				fields: { slug: 'lesson-3', title: 'Lesson 3' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section1, [
					createLevel2Wrapper(lesson1),
					createLevel2Wrapper(lesson2),
				]),
				createLevel1Wrapper(section2, [createLevel2Wrapper(lesson3)]),
			])

			const flattened = flattenNavigationResources(navigation)
			expect(flattened).toHaveLength(3)
			expect(flattened.map((r) => r.id)).toEqual([
				'lesson-1',
				'lesson-2',
				'lesson-3',
			])
		})
	})

	describe('findParentLessonForSolution', () => {
		it('finds parent lesson when solution is nested under section > lesson', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [createLevel3Wrapper(solution)]),
				]),
			])

			const parentLesson = findParentLessonForSolution(navigation, 'solution-1')
			expect(parentLesson).not.toBeNull()
			expect(parentLesson?.id).toBe('lesson-1')
		})

		it('finds parent lesson when solution is under top-level lesson', () => {
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(lesson, [createLevel3Wrapper(solution)]),
			])

			const parentLesson = findParentLessonForSolution(navigation, 'solution-1')
			expect(parentLesson).not.toBeNull()
			expect(parentLesson?.id).toBe('lesson-1')
		})

		it('returns null when solution not found', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(findParentLessonForSolution(navigation, 'non-existent')).toBeNull()
		})

		it('returns null when navigation is empty', () => {
			const navigation = createNavigation([])
			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})

		it('returns null when navigation is null', () => {
			expect(findParentLessonForSolution(null, 'solution-1')).toBeNull()
		})

		it('handles multiple solutions in same lesson', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution1 = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})
			const solution2 = createResource({
				id: 'solution-2',
				type: 'solution',
				fields: { slug: 'solution-2', title: 'Solution 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [
						createLevel3Wrapper(solution1),
						createLevel3Wrapper(solution2),
					]),
				]),
			])

			const parentLesson1 = findParentLessonForSolution(
				navigation,
				'solution-1',
			)
			const parentLesson2 = findParentLessonForSolution(
				navigation,
				'solution-2',
			)

			expect(parentLesson1?.id).toBe('lesson-1')
			expect(parentLesson2?.id).toBe('lesson-1')
		})

		it('handles lessons with no solutions', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [createLevel2Wrapper(lesson)]),
			])

			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})

		it('handles sections with no lessons', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(section, [])])

			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})

		it('handles solution ID that does not exist', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const solution = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [createLevel3Wrapper(solution)]),
				]),
			])

			expect(findParentLessonForSolution(navigation, 'wrong-id')).toBeNull()
		})

		it('handles navigation with null resources', () => {
			const navigation = createNavigation(null)
			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})

		it('only matches solution type resources', () => {
			const section = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const nonSolution = createResource({
				id: 'solution-1',
				type: 'lesson', // Wrong type
				fields: { slug: 'solution-1', title: 'Not a solution' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section, [
					createLevel2Wrapper(lesson, [createLevel3Wrapper(nonSolution)]),
				]),
			])

			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})

		it('handles multiple sections with solutions', () => {
			const section1 = createResource({
				id: 'section-1',
				type: 'section',
				fields: { slug: 'section-1', title: 'Section 1' },
			})
			const section2 = createResource({
				id: 'section-2',
				type: 'section',
				fields: { slug: 'section-2', title: 'Section 2' },
			})
			const lesson1 = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})
			const lesson2 = createResource({
				id: 'lesson-2',
				type: 'lesson',
				fields: { slug: 'lesson-2', title: 'Lesson 2' },
			})
			const solution1 = createResource({
				id: 'solution-1',
				type: 'solution',
				fields: { slug: 'solution-1', title: 'Solution 1' },
			})
			const solution2 = createResource({
				id: 'solution-2',
				type: 'solution',
				fields: { slug: 'solution-2', title: 'Solution 2' },
			})

			const navigation = createNavigation([
				createLevel1Wrapper(section1, [
					createLevel2Wrapper(lesson1, [createLevel3Wrapper(solution1)]),
				]),
				createLevel1Wrapper(section2, [
					createLevel2Wrapper(lesson2, [createLevel3Wrapper(solution2)]),
				]),
			])

			const parentLesson1 = findParentLessonForSolution(
				navigation,
				'solution-1',
			)
			const parentLesson2 = findParentLessonForSolution(
				navigation,
				'solution-2',
			)

			expect(parentLesson1?.id).toBe('lesson-1')
			expect(parentLesson2?.id).toBe('lesson-2')
		})

		it('handles lessons with null resources array', () => {
			const lesson = createResource({
				id: 'lesson-1',
				type: 'lesson',
				fields: { slug: 'lesson-1', title: 'Lesson 1' },
			})

			const navigation = createNavigation([createLevel1Wrapper(lesson, null)])

			expect(findParentLessonForSolution(navigation, 'solution-1')).toBeNull()
		})
	})
})
