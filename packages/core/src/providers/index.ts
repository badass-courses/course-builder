import { WebAuthnConfig } from '@auth/core/providers/webauthn'

/**
 * The configuration object for a transcription service provider.
 */
export interface TranscriptionConfig {
  id: string
  name: string
  type: string
  options: TranscriptionUserConfig
  apiKey: string
  callbackUrl: string
  getCallbackUrl?: (options: {
    baseUrl: string
    params: Record<string, string>
  }) => string
  initiateTranscription: (options: {
    mediaUrl: string
    resourceId: string
  }) => Promise<any>
  handleCallback: (callbackData: any) => {
    srt: string
    transcript: string
    wordLevelSrt: string
  }
}

export const MockTranscriptionProvider: TranscriptionConfig = {
  id: 'mock-transcription' as const,
  name: 'Mock Transcription',
  type: 'transcription',
  options: {
    apiKey: 'mock-api-key',
    callbackUrl: 'mock-callback-url',
  },
  apiKey: 'mock-api-key',
  callbackUrl: 'mock-callback-url',
  getCallbackUrl: () => 'mock-callback-url',
  initiateTranscription: async () => ({ mock: 'transcription' }),
  handleCallback: () => ({
    srt: 'mock-srt',
    transcript: 'mock-transcript',
    wordLevelSrt: 'mock-word-level-srt',
  }),
}

export type TranscriptionUserConfig = Omit<
  Partial<TranscriptionConfig>,
  'options' | 'type'
> & {
  apiKey: string
  callbackUrl: string
}
/**
 * The user configuration object for a transcription service provider.
 */
export type ProviderType = 'transcription'

interface InternalProviderOptions {
  /** Used to deep merge user-provided config with the default config
   */
  options?: Record<string, any>
}

export type Provider<P = any> = (
  | (TranscriptionConfig & InternalProviderOptions)
  | ((...args: any) => TranscriptionConfig & InternalProviderOptions)
) &
  InternalProviderOptions
