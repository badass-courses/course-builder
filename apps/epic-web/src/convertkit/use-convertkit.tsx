import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { removeQueryParamsFromRouter } from '@/convertkit/remove-query-params-from-router'
import { Subscriber, SubscriberSchema } from '@/convertkit/subscriber'
import { identify } from '@/utils/analytics'
import { useQuery } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export type ConvertkitContextType = {
	subscriber?: Subscriber | boolean
	loadingSubscriber: boolean
	canShowCta: boolean
	refetch: () => Promise<any>
}

const defaultConvertKitContext: ConvertkitContextType = {
	loadingSubscriber: true,
	canShowCta: false,
	refetch: async () => {},
}

export const ConvertkitContext = React.createContext(defaultConvertKitContext)

function getSearchParams(): URLSearchParams {
	const url = window.location.href
	return new URLSearchParams(url.split('?')[1])
}

export const ConvertkitProvider: React.FC<
	React.PropsWithChildren<{ getSubscriberApiUrl?: string; learnerId?: string }>
> = ({ children, learnerId }) => {
	const router = useRouter()
	const pathname = usePathname()
	const { status: sessionStatus } = useSession()

	const {
		data: subscriber,
		status,
		refetch,
	} = useQuery({
		queryKey: [`convertkit-subscriber`, learnerId, pathname],
		queryFn: async () => {
			const searchParams = getSearchParams()
			const ckSubscriberId = searchParams.get('ck_subscriber_id')

			console.log('ckSubscriberId', ckSubscriberId)

			try {
				const learner = searchParams.get('learner') || learnerId
				const subscriberLoaderParams = new URLSearchParams({
					...(learner && { learner }),
					...(ckSubscriberId && { subscriberId: ckSubscriberId }),
				})

				const subscriber = await fetch(
					`/api/coursebuilder/subscriber/convertkit?${subscriberLoaderParams}`,
				)
					.then((response) => response.json())
					.catch(() => undefined)

				identify(subscriber)

				if (!isEmpty(ckSubscriberId)) {
					if (pathname.match(/confirmToast=true/))
						confirmSubscriptionToast(subscriber.email_address)
					removeQueryParamsFromRouter(router, pathname, searchParams, [
						'ck_subscriber_id',
					])
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
			value={{
				subscriber,
				loadingSubscriber: status !== 'success',
				refetch,
				canShowCta:
					!subscriber &&
					status === 'success' &&
					sessionStatus === 'unauthenticated',
			}}
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
