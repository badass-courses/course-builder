import * as React from 'react'
import { getVideoResource } from '@/lib/video-resource-query'

/**
 * Custom hook to poll for video resource transcript because sometimes
 * the timing is JUST right and the webhook gets missed so a poll helps
 * makes sure it's not stuck in a loading state
 * @param options
 */
export function useTranscript(options: {
  videoResourceId: string | null | undefined
  initialTranscript?: string | null
}) {
  const [transcript, setTranscript] = React.useState<string | null>(options.initialTranscript || null)
  async function* pollVideoResourceTranscript(
    videoResourceId: string,
    maxAttempts = 30,
    initialDelay = 250,
    delayIncrement = 1000,
  ) {
    let delay = initialDelay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const videoResource = await getVideoResource(videoResourceId)
      if (videoResource?.transcript) {
        yield videoResource.transcript
        return
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
      delay += delayIncrement
    }

    throw new Error('Video resource not found after maximum attempts')
  }

  React.useEffect(() => {
    async function run() {
      try {
        if (options.videoResourceId) {
          const { value: transcript } = await pollVideoResourceTranscript(options.videoResourceId).next()
          if (transcript) {
            setTranscript(transcript)
          }
        }
      } catch (error) {
        console.error('Error polling video resource transcript:', error)
      }
    }

    if (!options.initialTranscript) {
      run()
    }
  }, [options.initialTranscript, options.videoResourceId])

  return [transcript, setTranscript] as const
}
