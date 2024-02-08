import { DeepgramResults } from '@/inngest/events/deepgram-webhook'
import { Paragraph, srtProcessor } from '@/lib/srt-processor'

export function srtFromTranscriptResult(results: DeepgramResults) {
  return srtProcessor(results.channels[0]?.alternatives[0]?.words)
}

function convertTime(inputSeconds?: number) {
  if (!inputSeconds) {
    return '--:--:--'
  }
  const date = new Date(inputSeconds * 1000)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

function formatTimeString(str: string) {
  const [h, m, s] = str.split(':')
  if (h == '00') {
    return `${m}:${s}`
  }

  return `${h}:${m}:${s}`
}

export function transcriptAsParagraphsWithTimestamps(results: DeepgramResults): string {
  let paragraphs: Paragraph[] = []
  if (results.channels[0]?.alternatives[0]?.paragraphs) {
    paragraphs = results.channels[0].alternatives[0].paragraphs.paragraphs
  } else if (results.channels[0]?.alternatives[0]?.transcript) {
    const text = results.channels[0].alternatives[0].transcript
    paragraphs = [
      {
        text,
        sentences: [
          {
            text,
            start: 0,
            end:
              results.channels[0].alternatives[0].words[results.channels[0].alternatives[0].words?.length - 1 || 0]
                ?.end || 0,
          },
        ],
      },
    ]
  }

  return (
    paragraphs?.reduce(
      (acc: string, paragraph: { sentences: { text: string; start: number; end: number }[] }): string => {
        const startTime = formatTimeString(convertTime(paragraph?.sentences?.[0]?.start))
        const text = paragraph.sentences.map((x) => x.text).join(' ')

        return `${acc}[${startTime}] ${text}
		
`
      },
      ``,
    ) || ''
  )
}
