import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const OCR_ASSISTANT = await openai.beta.assistants.create({
  name: 'OCR Assistant',
  instructions:
    "This assistant takes an image which may or may not contain a code snippet. It returns the code snippet if it exists, or 'no code found' if it does not. The code snippet is formatted for readability and includes the language in the codefence declaration.",
  model: 'gpt-4',
})
