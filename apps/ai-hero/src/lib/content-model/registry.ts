import { createSchemaRegistry } from '@coursebuilder/content-api'

import { LessonSchema } from '@/lib/lessons'
import { PageSchema } from '@/lib/pages'
import { PostSchema } from '@/lib/posts'
import { SolutionSchema } from '@/lib/solution'
import { SurveySchema } from '@/lib/surveys'
import { WorkshopSchema } from '@/lib/workshops'

export const registry = createSchemaRegistry()
	.register('post', PostSchema.shape.fields, ['create', 'read', 'update', 'delete'], {
		label: 'Post',
	})
	.register('lesson', LessonSchema.shape.fields, ['read', 'update'], {
		label: 'Lesson',
	})
	.register('solution', SolutionSchema.shape.fields, ['create', 'read', 'update', 'delete'], {
		label: 'Solution',
	})
	.register('survey', SurveySchema.shape.fields, ['read', 'update'], {
		label: 'Survey',
	})
	.register('workshop', WorkshopSchema.shape.fields, ['read', 'update'], {
		label: 'Workshop',
	})
	.register('page', PageSchema.shape.fields, ['read', 'update'], {
		label: 'Page',
	})
	.withEdges([
		{ parentType: 'lesson', childType: 'videoResource' },
		{ parentType: 'lesson', childType: 'solution' },
		{ parentType: 'section', childType: 'lesson' },
		{ parentType: 'workshop', childType: 'section' },
		{ parentType: 'solution', childType: 'videoResource' },
		{ parentType: 'videoResource', childType: 'raw-transcript' },
	])
