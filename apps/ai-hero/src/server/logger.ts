import { env } from '@/env.mjs'

import { createLogger } from '@coursebuilder/next/server'

export const log = createLogger({
	token: process.env.AXIOM_TOKEN!,
	orgId: 'ai-hero',
	dataset: env.NEXT_PUBLIC_AXIOM_DATASET!,
	logErrorsInDev: env.NODE_ENV === 'development',
})
