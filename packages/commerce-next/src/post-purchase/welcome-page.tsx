'use client'

import * as React from 'react'
import Image from 'next/image.js'
import Link from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import { first } from 'lodash'
import { FileText } from 'lucide-react'
import { signIn } from 'next-auth/react'
import pluralize from 'pluralize'
import Balancer from 'react-wrap-balancer'

import * as InvoiceTeaser from '@coursebuilder/commerce-next/invoices/invoice-teaser'
import * as PurchaseTransfer from '@coursebuilder/commerce-next/post-purchase/purchase-transfer'
import * as InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import {
	Product,
	Purchase,
	PurchaseUserTransfer,
} from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'

import { Icon } from '../components'

type PersonalPurchase = {
	id: string
	product: {
		id: string
		name: string
	}
}

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
}: {
	product: Product | null
	productResources?: ContentResource[] | null
	purchase: Purchase
	existingPurchase?: Purchase | null
	providers: any
	isGithubConnected: boolean
	upgrade: boolean
	redemptionsLeft: number
	isTransferAvailable: boolean
	purchaseUserTransfers: PurchaseUserTransfer[]
	hasCharge: boolean
	userEmail?: string | null
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
			className="mx-auto flex w-full flex-grow flex-col items-center justify-center py-16"
			id="welcome"
		>
			<div className="flex w-full max-w-screen-md flex-col gap-3">
				<Header
					product={product}
					productResources={productResources}
					upgrade={upgrade}
					purchase={purchase}
					personalPurchase={purchase?.bulkCoupon && existingPurchase}
					providers={providers}
					isGithubConnected={isGithubConnected}
				/>
				<div className="flex flex-col gap-10">
					<div>
						<h2 className="text-primary pb-4 text-sm uppercase">Share</h2>
						<Share productName={purchase.product?.name || 'this'} />
					</div>
					{redemptionsLeft && (
						<div>
							<h2 className="text-primary pb-4 text-sm uppercase">
								Invite your team
							</h2>
							<InviteTeam.Root
								disabled={!redemptionsLeft}
								purchase={purchase}
								existingPurchase={existingPurchase}
								userEmail={userEmail}
								className="flex flex-col items-start gap-y-2"
							>
								<InviteTeam.SeatsAvailable className="[&_span]:font-semibold" />
								<p>
									Send the following invite link to your colleagues to get
									started:
								</p>
								<div className="flex w-full items-center gap-2">
									<InviteTeam.InviteLink />
									<InviteTeam.CopyInviteLinkButton />
								</div>
								<InviteTeam.SelfRedeemButton className="" />
							</InviteTeam.Root>
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
								<InvoiceTeaser.Link className="text-primary flex flex-shrink-0 hover:underline" />
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
}: {
	upgrade: boolean
	purchase: Purchase | null
	personalPurchase?: Purchase | null
	product?: Product | null
	productResources?: ContentResource[] | null
	providers?: any
	isGithubConnected: boolean
}) => {
	const githubProvider = providers.github
	const firstResource = first(productResources)

	return (
		<header>
			<div className="flex flex-col items-center gap-10 pb-8 sm:flex-row">
				{product?.fields.image && (
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
							{upgrade ? `You've Upgraded ` : `Welcome to `}
						</div>
						<Balancer>{purchase?.product?.name || 'a Thing'}</Balancer>
					</h1>

					{personalPurchase && (
						<div>
							<div className="flex flex-wrap justify-center gap-3 pt-8 sm:justify-start">
								{product?.type === 'self-paced' && firstResource && (
									<Link
										href={`/${pluralize(firstResource.type)}/${firstResource?.fields?.slug}`}
										className="bg-primary text-primary-foreground w-full rounded px-5 py-3 text-lg font-semibold text-gray-900 shadow-xl shadow-black/10 transition hover:brightness-110 sm:w-auto"
									>
										Start Learning
									</Link>
								)}
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
					)}
				</div>
			</div>
			{/* {purchase.bulkCoupon
        ? `${purchase.product?.name} team license!`
        : `${purchase.product?.name} license!`} */}
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
