/**
 * @module providers/deepgram
 */

import type { TranscriptionConfig, TranscriptionUserConfig } from './index.js'

/** The returned transcription result from Deepgram when using the callback. */
export interface DeepgramTranscriptionResult extends Record<string, any> {
  // TODO Define the structure of the transcription result according to Deepgram's API response
}

export default function Deepgram<P extends DeepgramTranscriptionResult>(
  options: Omit<TranscriptionUserConfig, 'apiKey'> & {
    /**
     * The API key for authenticating requests to Deepgram.
     */
    apiKey: string
    /**
     * The callback URL to which Deepgram will send the transcription results.
     */
    getCallbackUrl?: (options: { baseUrl: string; params: Record<string, string> }) => string
    callbackUrl: string
  },
): TranscriptionConfig<P> {
  return {
    id: 'deepgram',
    name: 'Deepgram',
    type: 'transcription',
    // Additional configuration options can be added here based on Deepgram's API requirements
    options,
    // Define how to initiate a transcription request to Deepgram
    initiateTranscription: async (transcriptOptions: { mediaUrl: string; resourceId: string }) => {
      const deepgramUrl = `https://api.deepgram.com/v1/listen`
      const defaultGetCallbackUrl = ({ baseUrl, params }: { baseUrl: string; params: Record<string, string> }) => {
        const callbackParams = new URLSearchParams(params)
        return `${baseUrl}?${callbackParams.toString()}`
      }
      const getCallbackUrl = options.getCallbackUrl || defaultGetCallbackUrl
      const utteranceSpiltThreshold = 0.5

      // just weird URL differences between dev and prod

      const deepgramParams = new URLSearchParams({
        model: 'whisper-large',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        utt_split: String(utteranceSpiltThreshold),
        callback: getCallbackUrl({
          baseUrl: `${options.callbackUrl}`,
          params: { videoResourceId: transcriptOptions.resourceId },
        }),
      })

      const deepgramResponse = await fetch(`${deepgramUrl}?${deepgramParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${options.apiKey}`,
        },
        body: JSON.stringify({
          url: transcriptOptions.mediaUrl,
        }),
      })

      return await deepgramResponse.json()
    },
    // Define how to handle the callback with the transcription result
    handleCallback: <P>(callbackData: any): P => {
      // TODO: Logic to handle the callback from Deepgram
      return {} as P
    },
  }
}
