import { serve } from 'inngest/astro'

import { functions, inngest } from '../../util/inngest'

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions,
})
