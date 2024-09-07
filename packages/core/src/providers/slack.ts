import {
	ChatPostMessageResponse,
	MessageAttachment,
	WebClient,
} from '@slack/web-api'

export interface NotificationProviderConfig {
	id: string
	name: string
	type: 'notification'
	options: NotificationProviderConsumerConfig
	apiKey?: string
	defaultChannelId?: string
	sendNotification: (
		options: NotificationOptions,
	) => Promise<ChatPostMessageResponse>
}

export type NotificationProviderConsumerConfig = Omit<
	Partial<NotificationProviderConfig>,
	'options' | 'type'
> & {
	apiKey?: string
	defaultChannelId?: string
}

export type NotificationOptions = {
	attachments: MessageAttachment[]
	channel?: string
	icon_emoji?: string
	username?: string
	text?: string
}

export default function SlackProvider(
	options: NotificationProviderConsumerConfig,
): NotificationProviderConfig {
	return {
		id: 'slack',
		name: 'Slack',
		type: 'notification',
		options,
		...options,
		sendNotification: async (sendOptions) => {
			if (!options.apiKey) {
				throw new Error('No apiKey found for notification provider')
			}
			const webClient = new WebClient(options.apiKey)
			const channel = sendOptions.channel || options.defaultChannelId
			if (!channel) {
				throw new Error('No channel found')
			}
			const {
				attachments,
				text,
				icon_emoji = ':robot_face:',
				username = 'Announce Bot',
			} = sendOptions
			try {
				return await webClient.chat.postMessage({
					icon_emoji,
					username,
					attachments,
					channel,
					text,
				})
			} catch (e) {
				console.log(e)
				return Promise.reject(e)
			}
		},
	} as const
}

export const mockSlackProvider: NotificationProviderConfig = {
	id: 'mock-slack' as const,
	name: 'Mock Slack',
	type: 'notification',
	options: {
		apiKey: 'mock-api-key',
	},
	apiKey: 'mock-api-key',
	sendNotification: async () => Promise.resolve({} as ChatPostMessageResponse),
}
