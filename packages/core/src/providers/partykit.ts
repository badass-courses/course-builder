export interface PartyProviderConfig {
	id: string
	name: string
	type: 'party'
	options: PartyProviderConsumerConfig
	partyUrlBase: string
	broadcastMessage: (options: BroadcastMessageOptions) => Promise<string>
}

export type PartyProviderConsumerConfig = Omit<
	Partial<PartyProviderConfig>,
	'options' | 'type'
> & {
	partyUrlBase: string
}

export type BroadcastMessageOptions = {
	body: Record<string, any>
	roomId: string
}

export default function PartykitProvider(
	options: PartyProviderConsumerConfig,
): PartyProviderConfig {
	return {
		id: 'partykit',
		name: 'PartyKit',
		type: 'party',
		options,
		...options,
		broadcastMessage: async (
			broadcastMessageOptions: BroadcastMessageOptions,
		) => {
			return await fetch(
				`${options.partyUrlBase}/party/${broadcastMessageOptions.roomId}`,
				{
					method: 'POST',
					body: JSON.stringify(broadcastMessageOptions.body),
				},
			)
				.then((res) => {
					return res.text()
				})
				.catch((e) => {
					console.error(e)
					throw e
				})
		},
	} as const
}

export const MockPartykitProvider: PartyProviderConfig = {
	id: 'mock-partykit' as const,
	name: 'Mock Partykit',
	type: 'party',
	options: {
		partyUrlBase: 'mock-callback-url',
	},
	partyUrlBase: 'mock-callback-url',
	broadcastMessage: () => Promise.resolve(''),
}
