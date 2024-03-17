/**
 * The configuration object for a transcription service provider.
 */
export interface TranscriptionConfig<P> {
  id: string
  name: string
  type: string
  options: TranscriptionUserConfig
  initiateTranscription: (options: { mediaUrl: string; resourceId: string }) => Promise<any>
  handleCallback: (callbackData: any) => P
}
/**
 * The user configuration object for a transcription service provider.
 */
export interface TranscriptionUserConfig {
  apiKey: string
  getCallbackUrl?: (options: { baseUrl: string; params: Record<string, string> }) => string
  callbackUrl: string
  additionalOptions?: Record<string, any>
}
//# sourceMappingURL=index.d.ts.map
