export interface ChatPostMessageResponse {
	ok: boolean
	channel: string
	ts: string
	message: {
		text: string
		username: string
		bot_id?: string
		attachments?: MessageAttachment[]
		type: string
		subtype?: string
	}
}

export interface MessageAttachment {
	fallback?: string
	color?: string
	pretext?: string
	author_name?: string
	author_link?: string
	author_icon?: string
	title?: string
	title_link?: string
	text?: string
	fields?: {
		title: string
		value: string
		short?: boolean
	}[]
	image_url?: string
	thumb_url?: string
	footer?: string
	footer_icon?: string
	ts?: number
}

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
				const response = await fetch('https://slack.com/api/chat.postMessage', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${options.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						icon_emoji,
						username,
						attachments,
						channel,
						text,
					}),
				})

				if (!response.ok) {
					throw new Error(`Slack API error: ${response.statusText}`)
				}

				return (await response.json()) as ChatPostMessageResponse
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
