import { WorkshopNavigation, type NavigationResource } from '@/lib/workshops'

export type AdjacentResource = {
	id: string
	slug: string
	title: string
	type: string
	parentId?: string
	parentSlug?: string
} | null

/**
 * Flattens all navigation resources, including nested solutions,
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

	// Helper function to process a resource and create virtual entries for exercises/solutions
	const processResource = (
		resource: NavigationResource,
		isInSection = false,
	) => {
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

	// Process all resources and flatten them
	navigation.resources.forEach((resource) => {
		if (resource.type === 'section') {
			// Process section's resources
			resource.resources.forEach((sectionItem) => {
				processResource(sectionItem, true)
			})
		} else {
			processResource(resource)
		}
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

	// Simplified logic based on current context and lesson properties
	const currentLesson = navigation.resources
		.flatMap((r) => (r.type === 'section' ? r.resources : [r]))
		.find((r) => r.id === currentResourceId && r.type === 'lesson')

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
