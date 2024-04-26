'use client'

import * as React from 'react'
import { revalidatePath } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icons'
import { InvoiceCard } from '@/path-to-purchase/invoice-card'
import { PurchaseTransferStatus } from '@/purchase-transfer/purchase-transfer-status'
import InviteTeam from '@/team'
import { signIn } from 'next-auth/react'
import Balancer from 'react-wrap-balancer'

import {
	Product,
	Purchase,
	PurchaseUserTransfer,
} from '@coursebuilder/core/schemas'

type PersonalPurchase = {
	id: string
	product: {
		id: string
		name: string
	}
}

export function WelcomePage({
	product,
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
}: {
	product: Product | null
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
}) {
	const router = useRouter()
	const [personalPurchase, setPersonalPurchase] = React.useState<
		PersonalPurchase | Purchase
	>(purchase?.bulkCoupon && existingPurchase ? existingPurchase : purchase)
	return (
		<main
			className="mx-auto flex w-full flex-grow flex-col items-center justify-center px-5 pb-32 pt-24"
			id="welcome"
		>
			<div className="flex w-full max-w-screen-md flex-col gap-3">
				<Header
					product={product}
					upgrade={upgrade}
					purchase={purchase}
					personalPurchase={personalPurchase}
					providers={providers}
					isGithubConnected={isGithubConnected}
				/>
				<div className="flex flex-col gap-10">
					<div>
						<h2 className="pb-2 font-semibold uppercase tracking-wide">
							Introduction
						</h2>
					</div>
					<div>
						<h2 className="pb-2 font-semibold uppercase tracking-wide">
							Share {process.env.NEXT_PUBLIC_SITE_TITLE}
						</h2>
						<Share productName={purchase.product?.name || 'this'} />
					</div>

					{redemptionsLeft && (
						<div>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Invite your team
							</h2>
							<Invite
								setPersonalPurchase={setPersonalPurchase}
								userEmail={userEmail}
								purchase={purchase}
								existingPurchase={existingPurchase}
							/>
						</div>
					)}
					{hasCharge && (
						<div>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Get your invoice
							</h2>
							<InvoiceCard purchase={purchase} />
						</div>
					)}
					{isTransferAvailable && purchaseUserTransfers && (
						<div>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Transfer this purchase to another email address
							</h2>
							<PurchaseTransferStatus
								purchaseUserTransfers={purchaseUserTransfers}
								refetch={async () => {
									router.refresh()
								}}
							/>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}

const Header: React.FC<
	React.PropsWithChildren<{
		upgrade: boolean
		purchase: Purchase | null
		personalPurchase?: PersonalPurchase | Purchase
		product?: Product | null
		providers?: any
		isGithubConnected: boolean
	}>
> = async ({
	upgrade,
	purchase,
	product,
	personalPurchase,
	providers = {},
	isGithubConnected,
}) => {
	const githubProvider = providers.github

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
						<span className="text-primary block pb-4 font-sans text-sm font-semibold uppercase tracking-wide">
							{upgrade ? `You've Upgraded ` : `Welcome to `}
						</span>
						<Balancer>{purchase?.product?.name || 'a Thing'}</Balancer>
					</h1>
					{personalPurchase && (
						<div>
							<div className="flex flex-wrap justify-center gap-3 pt-8 sm:justify-start">
								<Link
									href={`/workshops/${product?.resources?.[0]?.fields?.slug}`}
									className="bg-primary text-primary-foreground w-full rounded px-5 py-3 text-lg font-semibold text-gray-900 shadow-xl shadow-black/10 transition hover:brightness-110 sm:w-auto"
								>
									Start Learning
								</Link>
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

const Invite: React.FC<React.PropsWithChildren<any>> = ({
	setPersonalPurchase,
	session,
	purchase,
	existingPurchase,
	userEmail,
}) => {
	return (
		<InviteTeam
			setPersonalPurchase={setPersonalPurchase}
			userEmail={userEmail}
			purchase={purchase}
			existingPurchase={existingPurchase}
		/>
	)
}

const Share: React.FC<React.PropsWithChildren<{ productName: string }>> = ({
	productName,
}) => {
	const tweet = `https://twitter.com/intent/tweet/?text=${productName} ${process.env.NEXT_PUBLIC_URL}`
	return (
		<div className="flex flex-col justify-between gap-5 rounded-lg border border-gray-700/30 bg-gray-800 px-5 py-6 shadow-xl shadow-black/10 sm:flex-row sm:items-center">
			<p>
				Tell your friends about {process.env.NEXT_PUBLIC_SITE_TITLE},{' '}
				<br className="hidden sm:block" />
				it would help me to get a word out.{' '}
				<span role="img" aria-label="smiling face">
					😊
				</span>
			</p>
			<a
				href={tweet}
				rel="noopener noreferrer"
				target="_blank"
				className="flex items-center gap-2 self-start rounded-md border border-cyan-500 px-5 py-2.5 font-semibold text-cyan-400 transition hover:bg-cyan-600/20"
			>
				<Icon name="Twitter" /> Share with your friends!
			</a>
		</div>
	)
}
