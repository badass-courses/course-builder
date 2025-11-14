import { inngestConfig } from '@/inngest/inngest.config'
import { withSkill } from '@/server/with-skill'
import { serve } from 'inngest/next'

export const maxDuration = 300

const inngest = serve(inngestConfig)

export const GET = withSkill(inngest.GET)
export const POST = withSkill(inngest.POST)
export const PUT = withSkill(inngest.PUT)
