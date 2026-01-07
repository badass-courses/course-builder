import {
	WorkshopNavigation,
	type NavigationResource,
	type NavigationSection,
} from '@/lib/workshops'

export type AdjacentResource = {
	id: string
	slug: string
	title: string
	type: string
	parentId?: string
	parentSlug?: string
} | null

/**
 * Flattens all navigation resources, including nested solutions and nested sections,
 * and returns the next and previous resources relative to the current one.
 * Also determines if exercise or solution comes next based on current context.
 */
export function getAdjacentWorkshopResources(
	navigation: WorkshopNavigation | null,
	currentResourceId: string,
	currentContext?: 'lesson' | 'exercise' | 'solution', // Optional context from URL
): {
	nextResource: AdjacentResource
	prevResource: AdjacentResource
	isSolutionNext: boolean // True if current resource is a lesson with solution OR an exercise (solution comes next)
	isExerciseNext: boolean // True if current resource is a lesson with an exercise
} {
	const defaultReturn = {
		nextResource: null,
		prevResource: null,
		isSolutionNext: false,
		isExerciseNext: false,
	}
	if (!navigation) {
		return defaultReturn
	}

	// Create a fully flattened array of all resources, including lessons' solutions
	const flattenedNavResources: Array<{
		id: string
		slug: string
		title: string
		type: string
		parentId?: string
		parentSlug?: string
	}> = []

	/**
	 * Helper function to process a lesson/post resource and its solutions
	 */
	const processResource = (resource: NavigationResource) => {
		if (resource.type === 'section') {
			// Recursively process section contents
			processSection(resource)
			return
		}

		// Add the resource itself (lesson/post)
		flattenedNavResources.push({
			id: resource.id,
			slug: resource.slug,
			title: resource.title,
			type: resource.type,
		})

		// Add solutions (exercises are just URL states, not separate resources)
		if (
			resource.type === 'lesson' &&
			'resources' in resource &&
			resource.resources?.length > 0
		) {
			resource.resources.forEach((childResource) => {
				// Only add actual solution resources
				if (childResource.type === 'solution') {
					flattenedNavResources.push({
						id: childResource.id,
						slug: childResource.slug || resource.slug,
						title: childResource.title || resource.title,
						type: childResource.type,
						parentId: resource.id,
						parentSlug: resource.slug,
					})
				}
			})
		}
	}

	/**
	 * Recursively processes a section, handling nested sub-sections
	 */
	const processSection = (section: NavigationSection) => {
		section.resources.forEach((item) => {
			processResource(item)
		})
	}

	// Process all top-level resources and flatten them
	navigation.resources.forEach((resource) => {
		processResource(resource)
	})

	// Find the index of the current resource
	const navIndex = flattenedNavResources.findIndex(
		(resource) => resource.id === currentResourceId,
	)

	if (navIndex === -1) {
		return defaultReturn // Resource not found
	}

	// Get the next and previous resources (if any)
	let nextResource = flattenedNavResources[navIndex + 1] || null
	const prevResource = flattenedNavResources[navIndex - 1] || null

	/**
	 * Recursively find a lesson by ID in the navigation structure
	 */
	const findLessonById = (
		resources: NavigationResource[],
		id: string,
	): NavigationResource | undefined => {
		for (const r of resources) {
			if (r.type === 'section') {
				const found = findLessonById(r.resources, id)
				if (found) return found
			} else if (r.id === id && r.type === 'lesson') {
				return r
			}
		}
		return undefined
	}

	// Find current lesson using recursive search
	const currentLesson = findLessonById(navigation.resources, currentResourceId)

	const hasExercise =
		(currentLesson?.type === 'lesson' &&
			currentLesson.resources?.some((r) => r.type === 'exercise')) ||
		false
	const hasSolution =
		(currentLesson?.type === 'lesson' &&
			currentLesson.resources?.some((r) => r.type === 'solution')) ||
		false

	let isExerciseNext = false
	let isSolutionNext = false

	if (currentContext === 'lesson') {
		// On lesson: exercise comes next if it exists, otherwise solution
		isExerciseNext = hasExercise
		isSolutionNext = !hasExercise && hasSolution

		// Override nextResource for exercise/solution navigation
		if (isExerciseNext) {
			nextResource = {
				id: `${currentResourceId}-exercise`,
				slug: currentLesson?.slug || '',
				title: 'Exercise',
				type: 'exercise',
				parentId: currentResourceId,
				parentSlug: currentLesson?.slug || '',
			}
		} else if (isSolutionNext) {
			nextResource = {
				id: `${currentResourceId}-solution`,
				slug: currentLesson?.slug || '',
				title: "Kent's Solution",
				type: 'solution',
				parentId: currentResourceId,
				parentSlug: currentLesson?.slug || '',
			}
		}
	} else if (currentContext === 'exercise') {
		// On exercise: solution comes next if it exists
		isSolutionNext = hasSolution

		if (isSolutionNext) {
			nextResource = {
				id: `${currentResourceId}-solution`,
				slug: currentLesson?.slug || '',
				title: "Kent's Solution",
				type: 'solution',
				parentId: currentResourceId,
				parentSlug: currentLesson?.slug || '',
			}
		}
	}
	// On solution: use the actual next resource from navigation

	return {
		nextResource,
		prevResource,
		isSolutionNext,
		isExerciseNext,
	}
}
