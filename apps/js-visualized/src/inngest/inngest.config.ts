import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { computeVideoSplitPoints } from './functions/split_video'

export const inngestConfig = {
	client: inngest,
	functions: [
		...courseBuilderCoreFunctions.map(({ config, trigger, handler }) =>
			inngest.createFunction(config, trigger, handler),
		),
		userCreated,
		userSignupAdminEmail,
		postmarkWebhook,
		imageResourceCreated,
		computeVideoSplitPoints,
	],
}
