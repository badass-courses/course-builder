import { env } from '@/env.mjs'

import SlackProvider from '@coursebuilder/core/providers/slack'

export const slackProvider = SlackProvider({
	apiKey: env.SLACK_TOKEN,
	defaultChannelId: env.SLACK_DEFAULT_CHANNEL_ID,
})
