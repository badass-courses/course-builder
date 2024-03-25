import { NextRequest } from 'next/server'

import { CourseBuilder } from '@coursebuilder/core'

import { initCourseBuilder, NextCourseBuilderConfig } from './lib'
import { reqWithEnvURL, setEnvDefaults } from './lib/env'

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
	(req: NextRequest) => Promise<Response>
>

export interface NextCourseBuilderResult {
	handlers: AppRouteHandlers
	coursebuilder: any
}
