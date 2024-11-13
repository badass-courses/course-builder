import { db } from '@/db' //this is a LOCAL (to this project) provider for now

import {
	communicationChannel,
	communicationPreferences,
	communicationPreferenceTypes,
} from '@/db/schema'
import { guid } from '@/utils/guid'
import { nanoid } from 'nanoid'

import {
	EmailListConfig,
	EmailListConsumerConfig,
	EmailListSubscribeOptions,
} from '@coursebuilder/core/providers'
import { CookieOption } from '@coursebuilder/core/types'

export const emailListProvider = EmailListProvider({
	apiKey: '',
	apiSecret: '',
	defaultListType: 'Newsletter',
})

function EmailListProvider(
	// the config/options could include CourseBuilderAdapter
	// which would allow doing the work against the database
	// to be abstracted away from the provider unlike below
	// where we are just using the database directly via drizzle
	options: EmailListConsumerConfig,
): EmailListConfig {
	return {
		id: 'coursebuilder',
		name: 'Coursebuilder List',
		type: 'email-list',
		defaultListType: 'Newsletter',
		options,
		apiKey: options.apiKey,
		apiSecret: options.apiSecret,
		getSubscriberByEmail: async (email: string) => {
			if (!email) return null

			const user = await db.query.users.findFirst({
				where: (user, { eq }) => eq(user.email, email),
			})

			return user
				? {
						id: user.id,
						first_name: user.name,
						email_address: user.email,
						// TODO: filter the fields?
						fields: user.fields || {},
					}
				: null
		},
		getSubscriber: async (subscriberId: string | null | CookieOption) => {
			if (typeof subscriberId !== 'string') {
				return null
			}

			const user = await db.query.users.findFirst({
				where: (user, { eq }) => eq(user.id, subscriberId),
			})

			return user
				? {
						id: user.id,
						first_name: user.name,
						email_address: user.email,
						// TODO: filter the fields?
						fields: user.fields || {},
					}
				: null
		},
		subscribeToList: async (subscribeOptions: EmailListSubscribeOptions) => {
			const { user, listType, fields } = subscribeOptions

			console.log({ subscribeOptions })

			if (!listType) {
				throw new Error('No listType provided')
			}

			// find or create the preference type
			let preferenceType =
				await db.query.communicationPreferenceTypes.findFirst({
					where: (cpt, { eq }) => eq(cpt.name, listType),
				})
			if (!preferenceType) {
				await db.insert(communicationPreferenceTypes).values({
					id: guid(),
					name: listType,
					description: `Subscribe to ${listType}`,
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				preferenceType = await db.query.communicationPreferenceTypes.findFirst({
					where: (cpt, { eq }) => eq(cpt.name, listType),
				})
			}

			// find or create the preference type
			let preferenceChannel = await db.query.communicationChannel.findFirst({
				where: (cc, { eq }) => eq(cc.name, 'Email'),
			})

			if (!preferenceChannel) {
				await db.insert(communicationChannel).values({
					id: guid(),
					name: 'Email',
					description: `Subscribe to email`,
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				preferenceChannel = await db.query.communicationChannel.findFirst({
					where: (cc, { eq }) => eq(cc.name, 'Email'),
				})
			}

			console.log({ preferenceType, preferenceChannel })

			if (!preferenceType || !preferenceChannel) {
				throw new Error('Preference type or channel not found')
			}

			let preference = await db.query.communicationPreferences.findFirst({
				where: (cp, { and, eq }) =>
					and(
						eq(cp.userId, user.id),
						eq(cp.preferenceTypeId, preferenceType.id),
						eq(cp.channelId, preferenceChannel.id),
					),
			})

			if (!preference) {
				await db.insert(communicationPreferences).values({
					id: nanoid(),
					userId: user.id,
					preferenceTypeId: preferenceType.id,
					channelId: preferenceChannel.id,
					active: true,
					updatedAt: new Date(),
					optInAt: new Date(),
					createdAt: new Date(),
				})
				await db.query.communicationPreferences.findFirst({
					where: (cp, { and, eq }) =>
						and(
							eq(cp.userId, user.id),
							eq(cp.preferenceTypeId, preferenceType.id),
							eq(cp.channelId, preferenceChannel.id),
						),
				})
			}

			return user
		},
	}
}
