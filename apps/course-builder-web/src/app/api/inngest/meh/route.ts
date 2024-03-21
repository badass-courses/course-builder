import { Inngest } from 'inngest'
import { serve } from 'inngest/next'

export const maxDuration = 300

const appName = `gpt-4-ai-chains`

const inngest = serve({
  client: new Inngest({
    id: appName,
  }),
  functions: [],
})

export const { GET, POST, PUT } = inngest
