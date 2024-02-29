import { OCR_WEBHOOK_EVENT } from '@/inngest/events/ocr-webhook'
import { inngest } from '@/inngest/inngest.server'
import { extractCodeFromScreenshot } from '@/transcript-processing/extract-code-from-screenshot'

export const perform_code_extraction = inngest.createFunction(
  {
    id: `perform_code_extraction`,
    name: 'Perform Code Extraction',
  },
  {
    event: OCR_WEBHOOK_EVENT,
  },
  async ({ event, step }) => {
    const screenshotUrl = event.data.ocrWebhookEvent.screenshotUrl as string
    console.log('\t>>>> screenshotUrl: ', screenshotUrl)
    await step.run('extract code from screenshot', async () => {
      const codestring = await extractCodeFromScreenshot(screenshotUrl).catch((e) => console.error(e))
      return { codestring }
    })
  },
)
