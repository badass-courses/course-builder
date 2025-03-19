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
	mrkdwn_in?: string[]
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

export interface PostEphemeralResponse {
	ok: boolean
	message_ts: string
}

export interface PostEphemeralOptions {
	channel?: string
	user: string
	text?: string
	icon_emoji?: string
	username?: string
	as_user?: boolean
	thread_ts?: string
	attachments?: MessageAttachment[]
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
	createChannel: (
		options: CreateChannelOptions,
	) => Promise<CreateChannelResponse>
	inviteToChannel: (
		options: InviteToChannelOptions,
	) => Promise<InviteToChannelResponse>
	postEphemeral: (
		options: PostEphemeralOptions,
	) => Promise<PostEphemeralResponse>
}

export type NotificationProviderConsumerConfig = Omit<
	Partial<NotificationProviderConfig>,
	'options' | 'type'
> & {
	apiKey?: string
	defaultChannelId?: string
}

export type NotificationOptions = {
	attachments?: MessageAttachment[]
	channel?: string
	icon_emoji?: string
	username?: string
	text?: string
}

export interface CreateChannelResponse {
	ok: boolean
	channel: {
		id: string
		name: string
		is_channel: boolean
		created: number
		is_archived: boolean
		is_general: boolean
		unlinked: number
		creator: string
		name_normalized: string
		is_shared: boolean
		is_org_shared: boolean
		is_member: boolean
		is_private: boolean
		is_mpim: boolean
		last_read: string
		latest: any
		unread_count: number
		unread_count_display: number
		members: string[]
		topic: {
			value: string
			creator: string
			last_set: number
		}
		purpose: {
			value: string
			creator: string
			last_set: number
		}
	}
}

export interface CreateChannelOptions {
	name: string
	is_private?: boolean
}

export interface InviteToChannelResponse {
	ok: boolean
	channel: {
		id: string
		name: string
		is_channel: boolean
		created: number
		creator: string
		is_archived: boolean
		is_general: boolean
		name_normalized: string
		is_shared: boolean
		is_org_shared: boolean
		is_member: boolean
		is_private: boolean
		is_mpim: boolean
		is_read_only: boolean
		is_pending_ext_shared: boolean
		pending_shared: string[]
		unlinked: number
	}
}

export interface InviteToChannelOptions {
	/**
	 * The ID of the public or private channel to invite users to
	 */
	channel: string
	/**
	 * A comma separated list of user IDs. Up to 1000 users may be listed.
	 */
	users: string | string[]
	/**
	 * When set to true and multiple user IDs are provided, continue inviting the valid ones while disregarding invalid IDs
	 */
	force?: boolean
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
						'Content-Type': 'application/json; charset=utf-8',
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
		createChannel: async (createOptions) => {
			if (!options.apiKey) {
				throw new Error('No apiKey found for notification provider')
			}

			try {
				const response = await fetch(
					'https://slack.com/api/conversations.create',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${options.apiKey}`,
							'Content-Type': 'application/json; charset=utf-8',
						},
						body: JSON.stringify(createOptions),
					},
				)

				if (!response.ok) {
					throw new Error(`Slack API error: ${response.statusText}`)
				}

				const data = await response.json()

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`)
				}

				return data as CreateChannelResponse
			} catch (e) {
				console.log(e)
				return Promise.reject(e)
			}
		},
		inviteToChannel: async (inviteOptions) => {
			if (!options.apiKey) {
				throw new Error('No apiKey found for notification provider')
			}

			const users = Array.isArray(inviteOptions.users)
				? inviteOptions.users.join(',')
				: inviteOptions.users

			try {
				const response = await fetch(
					'https://slack.com/api/conversations.invite',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${options.apiKey}`,
							'Content-Type': 'application/json; charset=utf-8',
						},
						body: JSON.stringify({
							channel: inviteOptions.channel,
							users,
							force: inviteOptions.force,
						}),
					},
				)

				if (!response.ok) {
					throw new Error(`Slack API error: ${response.statusText}`)
				}

				const data = await response.json()

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`)
				}

				return data as InviteToChannelResponse
			} catch (e) {
				console.log(e)
				return Promise.reject(e)
			}
		},
		postEphemeral: async (ephemeralOptions) => {
			if (!options.apiKey) {
				throw new Error('No apiKey found for notification provider')
			}
			const channel = ephemeralOptions.channel || options.defaultChannelId
			if (!channel) {
				throw new Error('No channel found')
			}

			const {
				text,
				icon_emoji = ':eggo:',
				username = 'eggo',
				user,
				as_user,
				thread_ts,
				attachments,
			} = ephemeralOptions

			try {
				const response = await fetch(
					'https://slack.com/api/chat.postEphemeral',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${options.apiKey}`,
							'Content-Type': 'application/json; charset=utf-8',
						},
						body: JSON.stringify({
							icon_emoji,
							username,
							channel,
							text,
							user,
							as_user,
							thread_ts,
							attachments,
						}),
					},
				)

				if (!response.ok) {
					throw new Error(`Slack API error: ${response.statusText}`)
				}

				const data = await response.json()

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`)
				}

				return data as PostEphemeralResponse
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
	createChannel: async () => Promise.resolve({} as CreateChannelResponse),
	inviteToChannel: async () => Promise.resolve({} as InviteToChannelResponse),
	postEphemeral: async () => Promise.resolve({} as PostEphemeralResponse),
}
