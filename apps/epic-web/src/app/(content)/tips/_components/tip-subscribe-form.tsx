'use client'

import { use } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { redirectUrlBuilder, SubscribeToConvertkitForm } from '@/convertkit'
import { useConvertkit } from '@/convertkit/use-convertkit'
import { Tip } from '@/lib/tips'
import { track } from '@/utils/analytics'
import { setUserId } from '@amplitude/analytics-browser'
import { MailIcon } from 'lucide-react'

export const SubscribeForm = ({
	tipLoader,
}: {
	tipLoader: Promise<Tip | null>
}) => {
	const pathname = usePathname()
	const { subscriber } = useConvertkit()
	const router = useRouter()

	const tip = use(tipLoader)

	if (!tip) return null

	const handleOnSuccess = (subscriber: any, email?: string) => {
		if (subscriber) {
			const redirectUrl = redirectUrlBuilder(subscriber, pathname, {
				confirmToast: 'true',
			})
			email && setUserId(email)
			track('subscribed to email list', {
				lesson: tip.fields.slug,
				module: 'tips',
				location: 'below tip video',
				moduleType: 'tip',
				lessonType: 'tip',
			})
			router.refresh()
			router.push(redirectUrl)
		}
	}

	console.log({ subscriber })

	return !subscriber ? (
		<div className="mx-auto flex w-full max-w-lg flex-col items-center justify-between gap-5 border-b border-gray-100 px-3 pb-5 pt-4 md:pb-3 md:pt-3 lg:max-w-none lg:flex-row 2xl:px-0 dark:border-white/5">
			<div className="inline-flex items-center gap-2 text-lg font-semibold leading-tight md:text-base lg:flex-shrink-0 lg:text-sm">
				<div
					aria-hidden="true"
					className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-400/10"
				>
					<MailIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
				</div>{' '}
				New EpicWeb tips delivered to your inbox
			</div>
			<SubscribeToConvertkitForm
				actionLabel="Subscribe for EpicWeb tips"
				onSuccess={(subscriber, email) => {
					return handleOnSuccess(subscriber, email)
				}}
			/>
		</div>
	) : null
}
