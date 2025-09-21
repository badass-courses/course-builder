/**
 * Transform workshop database result into the expected ModuleSchema format
 *
 * This function converts the nested database structure into a simplified
 * format that matches the ModuleSchema requirements.
 */

interface DatabaseResource {
	id: string
	type: string
	fields: {
		slug?: string
		title?: string
		description?: string
		state?: string
		visibility?: string
		body?: string
		github?: string
		optional?: boolean
		thumbnailTime?: number
		[key: string]: any
	}
	resources?: Array<{
		resourceId: string
		position: number
		metadata?: any
		resource: DatabaseResource
	}>
	[key: string]: any
}

interface ModuleResource {
	_type: 'lesson' | 'exercise' | 'section'
	_id: string
	slug: string
	lessons?: Array<{
		_type: 'lesson' | 'exercise'
		_id: string
		slug: string
	}>
}

interface ModuleResult {
	resources: ModuleResource[] | null
}

/**
 * Transform a database workshop result into ModuleSchema format
 */
export function transformWorkshopToModuleSchema(
	workshop: DatabaseResource,
): ModuleResult {
	const resources: ModuleResource[] = []

	// Process each top-level resource (sections and lessons)
	workshop.resources?.forEach((resourceRelation) => {
		const resource = resourceRelation.resource

		if (resource.type === 'section') {
			const section = transformSection(resource)
			resources.push(section)
		} else if (resource.type === 'lesson') {
			const lesson = transformLesson(resource)
			resources.push(lesson)
		}
	})

	return {
		resources: resources.length > 0 ? resources : null,
	}
}

/**
 * Transform a section resource
 */
function transformSection(section: DatabaseResource): ModuleResource {
	const lessons: Array<{
		_type: 'lesson' | 'exercise'
		_id: string
		slug: string
	}> = []

	// Process lessons within the section
	section.resources?.forEach((resourceRelation) => {
		const resource = resourceRelation.resource

		if (resource.type === 'lesson') {
			// Check if lesson has a solution to determine type
			let hasSolution = false
			resource.resources?.forEach((nestedResourceRelation) => {
				if (nestedResourceRelation.resource.type === 'solution') {
					hasSolution = true
				}
			})

			lessons.push({
				_type: hasSolution ? 'exercise' : 'lesson',
				_id: resource.id,
				slug: resource.fields.slug || '',
			})
		}
	})

	return {
		_type: 'section',
		_id: section.id,
		slug: section.fields.slug || '',
		lessons,
	}
}

/**
 * Transform a lesson resource
 */
function transformLesson(lesson: DatabaseResource): ModuleResource {
	let hasSolution = false

	// Look for solution in lesson resources
	lesson.resources?.forEach((resourceRelation) => {
		const resource = resourceRelation.resource

		if (resource.type === 'solution') {
			hasSolution = true
		}
	})

	// Determine lesson type based on whether it has a solution
	// lesson becomes exercise if it contains a solution
	const lessonType = hasSolution ? 'exercise' : 'lesson'

	return {
		_type: lessonType,
		_id: lesson.id,
		slug: lesson.fields.slug || '',
	}
}
