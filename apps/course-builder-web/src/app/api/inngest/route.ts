import {serve} from 'inngest/next'
import {inngestConfig} from '@/inngest/inngest.config'
import {withSkill} from '@/server/with-skill'

export const maxDuration = 300

const inngest = serve(inngestConfig)

export const GET = withSkill(inngest.GET)
export const POST = withSkill(inngest.POST)
export const PUT = withSkill(inngest.PUT)
