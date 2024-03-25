import { NextRequest } from 'next/server.js'

import { CourseBuilder } from '@coursebuilder/core'
import { ResponseInternal } from '@coursebuilder/core/types'

import { reqWithEnvURL, setEnvDefaults } from './lib/env.js'
import { initCourseBuilder, NextCourseBuilderConfig } from './lib/index.js'

export default function NextCourseBuilder(
	config:
		| NextCourseBuilderConfig
		| ((request: NextRequest | undefined) => NextCourseBuilderConfig),
): NextCourseBuilderResult {
	if (typeof config === 'function') {
		const httpHandler = (req: NextRequest) => {
			const _config = config(req)
			setEnvDefaults(_config)
			return CourseBuilder(reqWithEnvURL(req), _config)
		}
		return {
			handlers: { GET: httpHandler, POST: httpHandler } as const,
			coursebuilder: initCourseBuilder(config, (c) => setEnvDefaults(c)),
		}
	}
	setEnvDefaults(config)
	const httpHandler = (req: NextRequest) =>
		CourseBuilder(reqWithEnvURL(req), config)
	return {
		handlers: { POST: httpHandler, GET: httpHandler } as const,
		coursebuilder: initCourseBuilder(config, (c) => setEnvDefaults(c)),
	}
}

export { type NextCourseBuilderConfig }

type AppRouteHandlers = Record<
	'GET' | 'POST',
	(req: NextRequest) => Promise<Response | ResponseInternal>
>

export interface NextCourseBuilderResult {
	handlers: AppRouteHandlers
	coursebuilder: any
}
