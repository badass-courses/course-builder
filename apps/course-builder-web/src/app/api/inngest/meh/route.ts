import { Inngest } from 'inngest'
import { serve } from 'inngest/next'

export const maxDuration = 300

const appName = `gpt-4-ai-chains`

const inngestClient = new Inngest({
  id: appName,
})

const noopFunction = inngestClient.createFunction({ id: 'noop' }, { event: 'noop' }, async () => {})

// this exists to kill previously named app since you can't delete it in cloud
const inngest = serve({
  client: inngestClient,
  functions: [noopFunction],
})

export const { GET, POST, PUT } = inngest
