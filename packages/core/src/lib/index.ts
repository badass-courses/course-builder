import { CourseBuilderConfig } from '../index'
import { RequestInternal, ResponseInternal } from '../types'
import * as actions from './actions'
import { init } from './init'

export async function CourseBuilderInternal(
  request: RequestInternal,
  courseBuilderOptions: CourseBuilderConfig,
): Promise<ResponseInternal> {
  const { action, providerId, error, method } = request

  const { options, cookies } = await init({
    courseBuilderOptions,
    action,
    providerId,
    url: request.url,
    cookies: request.cookies,
    isPost: method === 'POST',
  })

  if (method !== 'POST') {
    throw new Error('Method not allowed: only POST Supported')
  } else {
    switch (action) {
      case 'webhook':
        return await actions.webhook(request, cookies, options)
    }
  }
}
