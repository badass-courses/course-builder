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
    initiateTranscription: async (mediaUrl) => {
      // Logic to initiate transcription using Deepgram's API
    },
    // Define how to handle the callback with the transcription result
    handleCallback: (callbackData) => {
      // Logic to handle the callback from Deepgram
      return {}
    },
  }
}
