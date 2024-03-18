import { CourseBuilderAdapter } from '../../adapters'
import { MissingAdapter, MissingAdapterMethods, UnsupportedStrategy } from '../../errors'
import { CourseBuilderConfig } from '../../index'
import { RequestInternal } from '../../types'
import { WarningCode } from './logger'

type ConfigError = MissingAdapter | MissingAdapterMethods | UnsupportedStrategy

let hasTranscript = false
let warned = false

export function assertConfig(request: RequestInternal, options: CourseBuilderConfig): ConfigError | WarningCode[] {
  const { url } = request
  const warnings: WarningCode[] = []

  if (!warned && options.debug) warnings.push('debug-enabled')

  // Keep track of webauthn providers that use conditional UI

  for (const p of options.providers) {
    const provider = typeof p === 'function' ? p() : p
    if (provider.type === 'transcription') {
      hasTranscript = true
    }
  }

  const { adapter } = options

  let requiredMethods: (keyof CourseBuilderAdapter)[] = []

  if (hasTranscript) {
  }

  if (adapter) {
    const missing = requiredMethods.filter((m) => !(m in adapter))

    if (missing.length) {
      return new MissingAdapterMethods(`Required adapter methods were missing: ${missing.join(', ')}`)
    }
  }

  if (!warned) warned = true

  return warnings
}
