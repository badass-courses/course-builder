import { CourseBuilderConfig } from '../index'
import { RequestInternal, ResponseInternal } from '../types'
import * as actions from './actions'
import { init } from './init'
import { UnknownAction } from './utils/web'

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

  console.log('options', options)

  if (method === 'GET') {
    switch (action) {
      case 'srt':
        return await actions.srt(request, cookies, options)
    }
  } else {
    switch (action) {
      case 'webhook':
        return await actions.webhook(request, cookies, options)
    }
  }

  throw new UnknownAction(`Cannot handle action: ${action}`)
}
