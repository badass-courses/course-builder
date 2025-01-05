'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Balancer from 'react-wrap-balancer'
import type { Stripe } from 'stripe'

import { Subscription } from '@coursebuilder/core/schemas/subscription'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'

import { Icon } from '../components'

interface SubscriptionDetails {
	status: string
	quantity: number
	interval: string
	currentPeriodEnd: number
	cancelAtPeriodEnd: boolean
	price: {
		unitAmount: number | null
		currency: string
	}
}

function formatPrice(amount: number | null, currency: string): string {
	if (!amount) return 'N/A'
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase(),
	}).format(amount / 100)
}

function formatSubscriptionInterval(interval: string): string {
	return interval === 'month' ? 'Monthly' : 'Yearly'
}

interface Resource {
	fields?: {
		slug?: string
	}
}

export function SubscriptionWelcomePage({
	subscription,
	stripeSubscription,
	isGithubConnected,
	isDiscordConnected = false,
	providers = {},
	billingPortalUrl,
}: {
	subscription: Subscription | null
	stripeSubscription: Stripe.Subscription
	isGithubConnected: boolean
	isDiscordConnected?: boolean
	providers?: any
	billingPortalUrl: string
}) {
	if (!subscription) {
		redirect('/')
	}

	const product = subscription?.product

	const subscriptionDetails: SubscriptionDetails = {
		status: stripeSubscription.status,
		quantity: stripeSubscription.items.data[0]?.quantity || 1,
		interval:
			stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
		currentPeriodEnd: stripeSubscription.current_period_end,
		cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
		price: {
			unitAmount: stripeSubscription.items.data[0]?.price.unit_amount,
			currency: stripeSubscription.items.data[0]?.price.currency || 'usd',
		},
	}

	return (
		<main className="mx-auto flex w-full flex-grow flex-col items-center justify-center py-16">
			<div className="flex w-full max-w-screen-md flex-col gap-3">
				<header>
					<div className="flex flex-col items-center gap-10 pb-8 sm:flex-row">
						{product?.fields?.image && (
							<div className="flex flex-shrink-0 items-center justify-center">
								<Image
									src={product.fields.image.url}
									alt={product.name}
									width={250}
									height={250}
								/>
							</div>
						)}
						<div className="flex w-full flex-col items-center text-center sm:items-start sm:text-left">
							<h1 className="font-text w-full text-3xl font-bold sm:text-3xl lg:text-4xl">
								<div className="text-primary pb-2 text-sm font-normal uppercase">
									Welcome to your subscription
								</div>
								<Balancer>{product?.name || 'Subscription'}</Balancer>
							</h1>

							<div className="flex flex-wrap justify-center gap-3 pt-8 sm:justify-start">
								{providers.discord && !isDiscordConnected && (
									<button
										onClick={() => signIn('discord')}
										className="flex w-full items-center justify-center gap-2 rounded bg-gray-800 px-5 py-1 text-sm text-white transition hover:brightness-110 sm:w-auto"
									>
										<Icon name="Discord" size="20" />
										Join Discord
									</button>
								)}

								{providers.github && !isGithubConnected && (
									<button
										onClick={() => signIn('github')}
										className="flex w-full items-center justify-center gap-2 rounded bg-gray-800 px-5 py-3 text-lg font-semibold text-white shadow-xl shadow-black/10 transition hover:brightness-110 sm:w-auto"
									>
										<Icon name="Github" size="20" />
										Connect GitHub
									</button>
								)}
							</div>
						</div>
					</div>
				</header>

				<div className="flex flex-col gap-10">
					<div className="border-b pb-5">
						<h2 className="text-primary pb-4 text-sm uppercase">
							Subscription Details
						</h2>
						<div className="flex flex-col gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Status</span>
									<span className="capitalize">
										{subscriptionDetails.status}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Billing</span>
									<span>
										{formatSubscriptionInterval(subscriptionDetails.interval)} -{' '}
										{formatPrice(
											(subscriptionDetails.price.unitAmount ?? 0) *
												subscriptionDetails.quantity,
											subscriptionDetails.price.currency,
										)}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">
										Next Payment
									</span>
									<span>
										{new Date(
											subscriptionDetails.currentPeriodEnd * 1000,
										).toLocaleDateString()}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Seats</span>
									<span>{subscriptionDetails.quantity}</span>
								</div>
							</div>

							{subscriptionDetails.cancelAtPeriodEnd && (
								<div className="mt-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
									This subscription will cancel at the end of the current period
								</div>
							)}

							<div className="mt-4 flex gap-2">
								<Button asChild variant="outline">
									<Link href={billingPortalUrl}>Manage Billing</Link>
								</Button>
							</div>
						</div>
					</div>

					<div>
						<h2 className="text-primary pb-4 text-sm uppercase">Share</h2>
						<Share productName={product?.name || 'this subscription'} />
					</div>
				</div>
			</div>
		</main>
	)
}

const Share: React.FC<React.PropsWithChildren<{ productName: string }>> = ({
	productName,
}) => {
	const tweet = `https://twitter.com/intent/tweet/?text=${productName} ${process.env.NEXT_PUBLIC_URL}`
	return (
		<div className="flex flex-col justify-between gap-5 rounded border px-5 py-6 sm:flex-row sm:items-center">
			<p>
				Tell your friends about {process.env.NEXT_PUBLIC_SITE_TITLE},{' '}
				<br className="hidden sm:block" />
				it would help me to get a word out.{' '}
				<span role="img" aria-label="smiling face">
					😊
				</span>
			</p>
			<Button asChild variant="outline" className="flex items-center gap-2">
				<a href={tweet} rel="noopener noreferrer" target="_blank">
					<Icon name="Twitter" /> Share with your friends!
				</a>
			</Button>
		</div>
	)
}
