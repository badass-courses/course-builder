/**
 * @module providers/deepgram
 */
export default function Deepgram(options) {
  return {
    id: 'deepgram',
    name: 'Deepgram',
    type: 'transcription',
    // Additional configuration options can be added here based on Deepgram's API requirements
    options,
    // Define how to initiate a transcription request to Deepgram
    initiateTranscription: async (transcriptOptions) => {
      const deepgramUrl = `https://api.deepgram.com/v1/listen`
      const defaultGetCallbackUrl = ({ baseUrl, params }) => {
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
    handleCallback: (callbackData) => {
      // TODO: Logic to handle the callback from Deepgram
      return {}
    },
  }
}
