import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { removeQueryParamsFromRouter } from '@/convertkit/remove-query-params-from-router'
import { Subscriber, SubscriberSchema } from '@/convertkit/subscriber'
import { identify } from '@/utils/analytics'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { isEmpty } from 'lodash'
import toast from 'react-hot-toast'

export type ConvertkitContextType = {
	subscriber?: Subscriber | boolean
	loadingSubscriber: boolean
	refetch: () => Promise<any>
}

const defaultConvertKitContext: ConvertkitContextType = {
	loadingSubscriber: true,
	refetch: async () => {},
}

export const ConvertkitContext = React.createContext(defaultConvertKitContext)

export const ConvertkitProvider: React.FC<
	React.PropsWithChildren<{ getSubscriberApiUrl?: string; learnerId?: string }>
> = ({ children, learnerId }) => {
	const router = useRouter()
	const pathname = usePathname()

	const {
		data: subscriber,
		status,
		refetch,
	} = useQuery({
		queryKey: [`convertkit-subscriber`, learnerId],
		queryFn: async () => {
			const params = new URLSearchParams(window.location.search)
			const ckSubscriberId = Cookies.get('ck_subscriber_id')

			try {
				const learner = params.get('learner') || learnerId
				const subscriberLoaderParams = new URLSearchParams({
					...(learner && { learner }),
					...(ckSubscriberId && { ckSubscriberId }),
				})

				const subscriber = await fetch(
					`/api/skill/subscriber/convertkit?${subscriberLoaderParams}`,
				)
					.then((response) => response.json())
					.catch(() => undefined)

				identify(subscriber)

				if (!isEmpty(ckSubscriberId)) {
					if (pathname.match(/confirmToast=true/))
						confirmSubscriptionToast(subscriber.email_address)
					removeQueryParamsFromRouter(router, ['ck_subscriber_id'])
				}

				const parsedSubscriber = SubscriberSchema.safeParse(subscriber)
				if (parsedSubscriber.success) {
					return parsedSubscriber.data
				}

				return false
			} catch (e) {
				console.debug(`couldn't load ck subscriber cookie`)
				return false
			}
		},
	})

	return (
		<ConvertkitContext.Provider
			value={{ subscriber, loadingSubscriber: status !== 'success', refetch }}
		>
			{children}
		</ConvertkitContext.Provider>
	)
}

export function useConvertkit() {
	return React.useContext(ConvertkitContext)
}

export const confirmSubscriptionToast = (email?: string) => {
	return toast(
		() => (
			<div>
				<strong>Confirm your subscription</strong>
				<p>
					Please check your inbox{' '}
					{email && (
						<>
							(<strong>{email}</strong>)
						</>
					)}{' '}
					for an email that just got sent. Thanks!
				</p>
			</div>
		),
		{
			icon: '✉️',
			duration: 6000,
		},
	)
}
