import { COURSEBUILDER_URL } from 'astro:env/server'

import { type CourseBuilderConfig } from '@coursebuilder/core'

export default {
	basePath: '/api/coursebuilder',
	providers: [],
	authConfig: {
		providers: [],
	},
	baseUrl: COURSEBUILDER_URL,
} satisfies CourseBuilderConfig
