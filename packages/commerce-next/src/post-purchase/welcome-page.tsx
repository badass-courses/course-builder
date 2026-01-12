'use client'

import * as React from 'react'
import Image from 'next/image.js'
import Link from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import MuxPlayer from '@mux/mux-player-react'
import { format, isAfter } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { FileText } from 'lucide-react'
import { signIn } from 'next-auth/react'
import pluralize from 'pluralize'
import Balancer from 'react-wrap-balancer'

import * as InvoiceTeaser from '@coursebuilder/commerce-next/invoices/invoice-teaser'
import * as PurchaseTransfer from '@coursebuilder/commerce-next/post-purchase/purchase-transfer'
import InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import {
	Product,
	Purchase,
	PurchaseUserTransfer,
} from '@coursebuilder/core/schemas'
import type { ContentResource, ProductType } from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'

import { Icon } from '../components'

export function WelcomePage({
	product,
	productResources,
	purchase,
	existingPurchase,
	upgrade,
	providers,
	isGithubConnected,
	redemptionsLeft,
	isTransferAvailable,
	purchaseUserTransfers,
	hasCharge,
	userEmail,
	initiatePurchaseTransfer,
	cancelPurchaseTransfer,
	isDiscordConnected = false,
	welcomeVideoPlaybackId,
	welcomeVideoPosterImageUrl,
}: {
	product: Product | null
	productResources?: ContentResource[] | null
	purchase: Purchase
	existingPurchase?: Purchase | null
	providers: any
	isGithubConnected: boolean
	isDiscordConnected?: boolean
	upgrade: boolean
	redemptionsLeft: number
	isTransferAvailable: boolean
	purchaseUserTransfers: PurchaseUserTransfer[]
	hasCharge: boolean
	userEmail?: string | null
	welcomeVideoPlaybackId?: string
	welcomeVideoPosterImageUrl?: string
	initiatePurchaseTransfer: (input: {
		email: string
		purchaseUserTransferId: string
	}) => Promise<any>
	cancelPurchaseTransfer: (input: {
		purchaseUserTransferId: string
	}) => Promise<any>
}) {
	const router = useRouter()
	return (
		<main
			className="mx-auto flex w-full grow flex-col items-center justify-center py-16"
			id="welcome"
		>
			<div className="max-w-(--breakpoint-md) flex w-full flex-col gap-3">
				<Header
					product={product}
					productResources={productResources}
					upgrade={upgrade}
					purchase={purchase}
					personalPurchase={purchase?.bulkCoupon ? existingPurchase : purchase}
					providers={providers}
					isGithubConnected={isGithubConnected}
					isDiscordConnected={isDiscordConnected}
				/>
				<div className="flex flex-col gap-10">
					{welcomeVideoPlaybackId && (
						<>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Introduction
							</h2>
							<MuxPlayer
								metadata={{
									video_title: `${product?.name} Welcome Video`,
								}}
								poster={welcomeVideoPosterImageUrl}
								className="overflow-hidden rounded-md shadow-2xl shadow-black/30"
								playbackId={welcomeVideoPlaybackId}
							/>
						</>
					)}

					{redemptionsLeft && (
						<div>
							<h2 className="text-primary pb-4 text-sm uppercase">
								Invite your team
							</h2>
							<InviteTeam
								disabled={!redemptionsLeft}
								purchase={purchase}
								existingPurchase={existingPurchase}
								userEmail={userEmail}
								className="flex flex-col items-start gap-y-2"
							/>
						</div>
					)}

					{hasCharge && (
						<div className="border-b pb-5">
							<h2 className="text-primary pb-4 text-sm uppercase">
								Get your invoice
							</h2>
							<InvoiceTeaser.Root
								className="flex w-full flex-row items-center justify-between sm:gap-10"
								purchase={purchase}
							>
								<InvoiceTeaser.Link className="flex w-full flex-col justify-between sm:flex-row sm:items-center">
									<InvoiceTeaser.Title className="inline-flex items-center gap-2">
										<FileText className="h-4 w-4 opacity-75" />
										<span className="underline">{product?.name}</span>
									</InvoiceTeaser.Title>
									<InvoiceTeaser.Metadata />
								</InvoiceTeaser.Link>
								<InvoiceTeaser.Link className="text-primary flex shrink-0 hover:underline" />
							</InvoiceTeaser.Root>
						</div>
					)}
					{isTransferAvailable && purchaseUserTransfers && (
						<div>
							<h2 className="text-primary pb-4 text-sm uppercase">
								Transfer this purchase to another email address
							</h2>
							<PurchaseTransfer.Root
								onTransferInitiated={async () => {
									router.refresh()
								}}
								purchaseUserTransfers={purchaseUserTransfers}
								cancelPurchaseTransfer={cancelPurchaseTransfer}
								initiatePurchaseTransfer={initiatePurchaseTransfer}
							>
								<PurchaseTransfer.Available>
									<PurchaseTransfer.Description />
									<PurchaseTransfer.Form>
										<PurchaseTransfer.InputLabel />
										<PurchaseTransfer.InputEmail />
										<PurchaseTransfer.SubmitButton />
									</PurchaseTransfer.Form>
								</PurchaseTransfer.Available>
								<PurchaseTransfer.Initiated>
									<PurchaseTransfer.Description />
									<PurchaseTransfer.Cancel />
								</PurchaseTransfer.Initiated>
								<PurchaseTransfer.Completed>
									<PurchaseTransfer.Description />
								</PurchaseTransfer.Completed>
							</PurchaseTransfer.Root>
						</div>
					)}
					<div>
						<h2 className="text-primary pb-4 text-sm uppercase">Share</h2>
						<Share productName={purchase.product?.name || 'this'} />
					</div>
				</div>
			</div>
		</main>
	)
}

const Header = ({
	upgrade,
	purchase,
	product,
	productResources,
	personalPurchase,
	providers = {},
	isGithubConnected,
	isDiscordConnected = false,
}: {
	upgrade: boolean
	purchase: Purchase | null
	personalPurchase?: Purchase | null
	product?: Product | null
	productResources?: ContentResource[] | null
	providers?: any
	isGithubConnected: boolean
	isDiscordConnected?: boolean
}) => {
	const githubProvider = providers.github
	const discordProvider = providers.find(
		(p: { id: string }) => p.id === 'discord',
	)
	const firstResource = first(productResources)
	const getWelcomeMessageForProductType = (productType?: ProductType) => {
		if (productType === 'live') {
			return ''
		}

		if (upgrade) {
			return "You've Upgraded "
		}

		return 'Welcome to '
	}

	const cohortStartDate =
		product?.type === 'cohort' &&
		product?.resources?.[0]?.resource?.fields?.startsAt
	const cohortStartDateFormatted = cohortStartDate
		? format(new Date(cohortStartDate), 'MMMM d, yyyy h:mm a z')
		: null

	const isInFuture =
		cohortStartDate && isAfter(new Date(cohortStartDate), new Date())

	return (
		<header>
			<div className="flex flex-col items-center gap-10 pb-8 sm:flex-row">
				{product?.fields.image && (
					<div className="flex shrink-0 items-center justify-center">
						<Image
							src={product.fields.image.url}
							alt={product.name}
							width={250}
							height={250}
						/>
					</div>
				)}
				<div className="flex w-full flex-col items-center text-center sm:items-start sm:text-left">
					<h1 className="font-text w-full text-3xl font-semibold sm:text-3xl lg:text-4xl">
						<div className="text-primary pb-2 text-sm font-normal uppercase">
							{getWelcomeMessageForProductType(purchase?.product?.type)}
						</div>
						<Balancer>{purchase?.product?.name || 'a Thing'}</Balancer>
					</h1>

					<div>
						<div className="flex flex-wrap justify-center gap-3 pt-8 sm:justify-start">
							{personalPurchase && (
								<>
									{product?.type === 'self-paced' && firstResource && (
										<Button asChild>
											<Link
												href={`/${pluralize(firstResource.type)}/${firstResource?.fields?.slug}`}
											>
												Start Learning
											</Link>
										</Button>
									)}
									{product?.type === 'cohort' && (
										<Button
											asChild
											variant={isInFuture ? 'outline' : 'default'}
										>
											<Link
												href={`/${pluralize(product.type)}/${productResources?.[0]?.fields?.slug}`}
											>
												{isInFuture
													? `Cohort starts on ${cohortStartDateFormatted}`
													: 'Start Learning'}
											</Link>
										</Button>
									)}
								</>
							)}
							{discordProvider && !isDiscordConnected ? (
								<button
									data-discord-button=""
									onClick={() =>
										signIn(discordProvider.id, {
											callbackUrl: `${process.env.NEXT_PUBLIC_URL}/discord/redirect`,
										})
									}
									className="flex w-full items-center justify-center gap-2 rounded bg-gray-800 px-5 py-1 text-sm text-white transition hover:brightness-110 sm:w-auto"
								>
									<Icon name="Discord" size="20" />
									Join {discordProvider.name}
								</button>
							) : null}
							{githubProvider && !isGithubConnected ? (
								<button
									onClick={() => signIn(githubProvider.id)}
									className="flex w-full items-center justify-center gap-2 rounded bg-gray-800 px-5 py-3 text-lg font-semibold text-white shadow-xl shadow-black/10 transition hover:brightness-110 sm:w-auto"
								>
									<Icon name="Github" size="20" />
									Connect {githubProvider.name}
								</button>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</header>
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
