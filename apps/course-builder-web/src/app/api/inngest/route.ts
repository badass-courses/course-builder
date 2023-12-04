import {serve} from 'inngest/next'
import {inngestConfig} from '@/inngest/inngest.config'

export const maxDuration = 300

export const {GET, POST, PUT} = serve(inngestConfig)
