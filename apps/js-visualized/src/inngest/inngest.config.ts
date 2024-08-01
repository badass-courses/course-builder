import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

export const inngestConfig = {
	client: inngest,
	functions: [
		...courseBuilderCoreFunctions.map(({ config, trigger, handler }) =>
			inngest.createFunction(config, trigger, handler),
		),
		imageResourceCreated,
		postmarkWebhook,
	],
}
