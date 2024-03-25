import { NextRequest } from 'next/server'

import {
	setEnvDefaults as coreSetEnvDefaults,
	CourseBuilderConfig,
} from '@coursebuilder/core'

export function reqWithEnvURL(req: NextRequest): NextRequest {
	const url = process.env.COURSEBUILDER_URL
	if (!url) return req
	const { origin: envOrigin } = new URL(url)
	const { href, origin } = req.nextUrl
	return new NextRequest(href.replace(origin, envOrigin), req)
}

export function setEnvDefaults(config: CourseBuilderConfig) {
	try {
		const url = process.env.COURSEBUILDER_URL
		if (!url) return
		const { pathname } = new URL(url)
		if (pathname === '/') return
		config.basePath ||= pathname
	} catch {
	} finally {
		config.basePath ||= '/api/coursebuilder'
		coreSetEnvDefaults(process.env, config)
	}
}
