import { z } from 'zod'

export const ParagraphSchema = z.object({
  text: z.string(),
  sentences: z.array(
    z.object({
      end: z.number(),
      start: z.number(),
      text: z.string(),
    }),
  ),
})

export type Paragraph = z.infer<typeof ParagraphSchema>

export const WordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
  punctuated_word: z.string(),
})

export type Word = z.infer<typeof WordSchema>

function convertTime(inputSeconds?: number) {
  if (!inputSeconds) {
    return '--:--:--'
  }
  const date = new Date(inputSeconds * 1000)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0')

  return `${hours}:${minutes}:${seconds},${milliseconds}`
}

export function srtProcessor(words?: Word[], toWordLevelTimestamps: boolean = false) {
  if (!words) {
    return ''
  }

  if (toWordLevelTimestamps) {
    const srtEntries = words.map((word, index) => {
      const startTime = convertTime(word.start)
      const endTime = convertTime(word.end)
      const text = word.punctuated_word
      return `${index + 1}
  ${startTime} --> ${endTime}
  ${text}
      `
    })

    return srtEntries.join('\n\n')
  }

  const timeLimitInSeconds = 5.5
  const charLimit = 42
  let currentTimeInSeconds = 0
  let currentCharCount = 0
  const arrayByTimes: Word[][] = []
  let tempArray: Word[] = []

  words.forEach((item, index) => {
    const timeExceeded = currentTimeInSeconds + (item.end - item.start) >= timeLimitInSeconds
    const charCountExceeded = currentCharCount + item.punctuated_word.length > charLimit

    if (timeExceeded || charCountExceeded || index === words.length - 1) {
      if (tempArray.length) {
        arrayByTimes.push(tempArray)
        tempArray = []
        currentTimeInSeconds = 0
        currentCharCount = 0
      }
    }

    if (!timeExceeded || !charCountExceeded) {
      tempArray.push(item)
      currentTimeInSeconds += item.end - item.start
      currentCharCount += item.punctuated_word.length
    }

    if (index === words.length - 1 && (!timeExceeded || !charCountExceeded)) {
      arrayByTimes.push(tempArray)
    }
  })

  const srtEntries = arrayByTimes.map((timeBlock, index) => {
    const startTime = convertTime(timeBlock[0]?.start)
    const endTime = convertTime(timeBlock[timeBlock.length - 1]?.end)
    const text = timeBlock.map((x) => x.punctuated_word).join(' ')
    return `${index + 1}
${startTime} --> ${endTime}
${text}
  `
  })

  return srtEntries.join('\n\n')
}
