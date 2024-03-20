import { NextRequest } from 'next/server'

import { CourseBuilder } from '@coursebuilder/core'

import { NextCourseBuilderConfig } from './lib'

export default function NextCourseBuilder(config: NextCourseBuilderConfig): NextCourseBuilderResult {
  const httpHandler = (req: NextRequest) => CourseBuilder(req, config)
  return {
    handlers: { POST: httpHandler, GET: httpHandler } as const,
  }
}

export { type NextCourseBuilderConfig }

type AppRouteHandlers = Record<'GET' | 'POST', (req: NextRequest) => Promise<Response>>

export interface NextCourseBuilderResult {
  handlers: AppRouteHandlers
}
