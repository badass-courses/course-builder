/**
 * @module providers/deepgram
 */
import type { TranscriptionConfig, TranscriptionUserConfig } from './index.js'

/** The returned transcription result from Deepgram when using the callback. */
export interface DeepgramTranscriptionResult extends Record<string, any> {}
export default function Deepgram<P extends DeepgramTranscriptionResult>(
  options: Omit<TranscriptionUserConfig<P>, 'apiKey'> & {
    /**
     * The API key for authenticating requests to Deepgram.
     */
    apiKey: string
    /**
     * The callback URL to which Deepgram will send the transcription results.
     */
    callbackUrl: string
  },
): TranscriptionConfig<P>
//# sourceMappingURL=transcript-provider-deepgram.d.ts.map
