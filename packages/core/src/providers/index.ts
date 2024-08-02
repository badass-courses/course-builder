import { AdapterUser } from '@auth/core/adapters'
import { EmailConfig } from '@auth/core/providers'
import { NodemailerConfig } from '@auth/core/providers/nodemailer'

import { Subscriber } from '../schemas/subscriber-schema'
import { CookieOption, PaymentsProviderConfig } from '../types'
import { LlmProviderConfig } from './openai'
import { PartyProviderConfig } from './partykit'
import { NotificationProviderConfig } from './slack'

export interface EmailListSubscribeOptions {
	listId?: string | number
	user: AdapterUser
	fields: Record<string, string>
	listType: string
}

export interface EmailListConfig {
	id: string
	name: string
	type: string
	options: EmailListConsumerConfig
	apiKey: string
	apiSecret: string
	defaultListType: string
	defaultListId?: number | string
	subscribeToList: (options: EmailListSubscribeOptions) => Promise<any>
	getSubscriber: (
		subscriberId: string | null | CookieOption,
	) => Promise<Subscriber | null>
}

export type EmailListConsumerConfig = Omit<
	Partial<EmailListConfig>,
	'options' | 'type'
> & {
	apiKey: string
	apiSecret: string
}

/**
 * The configuration object for a transcription service provider.
 */
export interface TranscriptionConfig {
	id: string
	name: string
	type: string
	options: TranscriptionUserConfig
	apiKey: string
	callbackUrl: string
	getCallbackUrl?: (options: {
		baseUrl: string
		params: Record<string, string>
	}) => string
	initiateTranscription: (options: {
		mediaUrl: string
		resourceId: string
	}) => Promise<any>
	handleCallback: (callbackData: any) => {
		srt: string
		transcript: string
		wordLevelSrt: string
	}
}

export const MockTranscriptionProvider: TranscriptionConfig = {
	id: 'mock-transcription' as const,
	name: 'Mock Transcription',
	type: 'transcription',
	options: {
		apiKey: 'mock-api-key',
		callbackUrl: 'mock-callback-url',
	},
	apiKey: 'mock-api-key',
	callbackUrl: 'mock-callback-url',
	getCallbackUrl: () => 'mock-callback-url',
	initiateTranscription: async () => ({ mock: 'transcription' }),
	handleCallback: () => ({
		srt: 'mock-srt',
		transcript: 'mock-transcript',
		wordLevelSrt: 'mock-word-level-srt',
	}),
}

export type TranscriptionUserConfig = Omit<
	Partial<TranscriptionConfig>,
	'options' | 'type'
> & {
	apiKey: string
	callbackUrl: string
}
/**
 * The user configuration object for a transcription service provider.
 */
export type ProviderType =
	| 'transcription'
	| 'email-list'
	| 'payment'
	| 'party'
	| 'checkout'
	| 'email'
	| 'notification'

interface InternalProviderOptions {
	/** Used to deep merge user-provided config with the default config
	 */
	options?: Record<string, any>
}

export interface CommonProviderOptions {
	/**
	 * Uniquely identifies the provider in {@link CourseBuilderConfig.providers}.
	 * It's also part of the URL
	 */
	id: string
	/**
	 * The provider name used on the default sign-in page's sign-in button.
	 * For example if it's "Google", the corresponding button will say:
	 * "Sign in with Google"
	 */
	name: string
	/** See {@link ProviderType} */
	type: ProviderType
}

export type Provider<P = any> = (
	| ((
			| TranscriptionConfig
			| EmailListConfig
			| LlmProviderConfig
			| PartyProviderConfig
			| PaymentsProviderConfig
			| EmailConfig
			| NodemailerConfig
			| NotificationProviderConfig
	  ) &
			InternalProviderOptions)
	| ((
			...args: any
	  ) => (
			| TranscriptionConfig
			| EmailListConfig
			| LlmProviderConfig
			| PartyProviderConfig
			| PaymentsProviderConfig
			| EmailConfig
			| NodemailerConfig
			| NotificationProviderConfig
	  ) &
			InternalProviderOptions)
) &
	InternalProviderOptions
