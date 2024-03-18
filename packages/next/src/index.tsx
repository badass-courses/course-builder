import { NextRequest } from 'next/server'

import { CourseBuilder } from '@coursebuilder/core'

import { NextCourseBuilderConfig } from './lib'

export default function NextCourseBuilder(
  config: NextCourseBuilderConfig | ((request: NextRequest | undefined) => NextCourseBuilderConfig),
) {
  if (typeof config === 'function') {
    const httpHandler = (req: NextRequest) => {
      const _config = config(req)
      return CourseBuilder(req, _config)
    }
    return {
      handlers: { POST: httpHandler } as const,
    }
  }

  const httpHandler = (req: NextRequest) => CourseBuilder(req, config)
  return {
    handlers: { POST: httpHandler } as const,
  }
}

export { type NextCourseBuilderConfig }

type AppRouteHandlers = Record<'GET' | 'POST', (req: NextRequest) => Promise<Response>>

export interface NextCourseBuilderResult {
  handlers: AppRouteHandlers
}
