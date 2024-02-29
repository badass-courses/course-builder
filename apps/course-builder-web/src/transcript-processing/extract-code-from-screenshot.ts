import { OCR_ASSISTANT } from '@/lib/assistants'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function extractCodeFromScreenshot(screenshotUrl: string) {
  console.info(`
  
    Extracting code from screenshot at ${screenshotUrl}
  
  `)

  const thread = await openai.beta.threads.create()

  const image_data = await fetch(screenshotUrl)

  const file_id = await openai.files
    .create({
      file: image_data,
      purpose: 'assistants',
    })
    .then((file) => file.id)

  await openai.beta.threads.messages.create(thread.id, {
    content: 'The following screenshot contains a code snippet. Please extract the code.',
    role: 'user',
    file_ids: [file_id],
  })

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: OCR_ASSISTANT.id,
  })

  let run_status = (await openai.beta.threads.runs.retrieve(thread.id, run.id)).status
  while (run_status !== 'completed' && run_status !== 'failed') {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    run_status = (await openai.beta.threads.runs.retrieve(thread.id, run.id)).status
  }

  if (run_status === 'failed') {
    const status = (await openai.beta.threads.runs.retrieve(thread.id, run.id)).last_error?.message
    throw new Error('Code extraction failed with error: ' + status)
  }

  const all_messages = await openai.beta.threads.messages.list(thread.id)
  // grab the last message
  const last_message = all_messages.data[all_messages.data.length - 1]
  if (!last_message) {
    throw new Error('No response from code extraction')
  }

  if (last_message.role !== 'assistant') {
    throw new Error('Unexpected response from code extraction')
  }

  const message_content = last_message.content

  if (!message_content) {
    throw new Error('No content in response from code extraction')
  }

  const message_payload = message_content[0]
  if (!message_payload) {
    throw new Error('No payload in response from code extraction')
  }

  if (message_payload.type !== 'text') {
    throw new Error('Unexpected payload type in response from code extraction')
  }

  const text_object = message_payload.text
  if (!text_object) {
    throw new Error('No text in response from code extraction')
  }

  return text_object.value
}
