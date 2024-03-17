/**
 * The configuration object for a transcription service provider.
 */
export interface TranscriptionConfig {
  id: string
  name: string
  type: string
  options: TranscriptionUserConfig
  initiateTranscription: (options: { mediaUrl: string; resourceId: string }) => Promise<any>
  handleCallback: (callbackData: any) => { srt: string; transcript: string; wordLevelSrt: string }
}

/**
 * The user configuration object for a transcription service provider.
 */
export interface TranscriptionUserConfig {
  apiKey: string
  getCallbackUrl?: (options: { baseUrl: string; params: Record<string, string> }) => string
  callbackUrl: string
  additionalOptions?: Record<string, any> // Any additional options required by the transcription service
}
