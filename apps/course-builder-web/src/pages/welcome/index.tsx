import * as React from 'react'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import { InvoiceCard } from '@/path-to-purchase/invoice-card'
import { convertToSerializeForNextResponse } from '@/path-to-purchase/serialize-for-next-response'
import { Transfer } from '@/purchase-transfer/purchase-transfer'
import { getServerAuthSession } from '@/server/auth'
import InviteTeam from '@/team'
import { api } from '@/trpc/react'
import MuxPlayer from '@mux/mux-player-react'
import { isString } from 'lodash'
import { getToken } from 'next-auth/jwt'
import { getProviders, signIn, useSession } from 'next-auth/react'
import Balancer from 'react-wrap-balancer'

import { Product, PurchaseUserTransfer } from '@coursebuilder/core/schemas'

export const getServerSideProps: GetServerSideProps = async ({
	req,
	query,
}) => {
	const { purchaseId: purchaseQueryParam, upgrade } = query
	const token = await getServerAuthSession()
	const user = token.session?.user

	const providers = await getProviders()
	const { getPurchaseDetails } = courseBuilderAdapter

	let purchaseId = purchaseQueryParam

	const session_id =
		query.session_id instanceof Array ? query.session_id[0] : query.session_id

	const paymentProvider = stripeProvider

	if (session_id && paymentProvider) {
		const { chargeIdentifier } = await paymentProvider.getPurchaseInfo(
			session_id,
			courseBuilderAdapter,
		)

		const purchase =
			await courseBuilderAdapter.getPurchaseForStripeCharge(chargeIdentifier)

		if (purchase) {
			purchaseId = purchase.id
		} else {
			return {
				redirect: {
					destination: `/thanks/purchase?session_id=${session_id}`,
					permanent: false,
				},
			}
		}
	}

	if (token && isString(purchaseId) && isString(user?.id)) {
		const { purchase, existingPurchase, availableUpgrades } =
			await getPurchaseDetails(purchaseId, user?.id)

		if (purchase) {
			const product = await courseBuilderAdapter.getProduct(purchase.productId)

			return {
				props: {
					product,
					purchase: convertToSerializeForNextResponse(purchase),
					existingPurchase,
					availableUpgrades,
					upgrade: upgrade === 'true',
					providers,
				},
			}
		} else {
			return {
				redirect: {
					destination: `/`,
					permanent: false,
				},
			}
		}
	}

	return {
		redirect: {
			destination: `/`,
			permanent: false,
		},
	}
}

type Purchase = {
	id: string
	merchantChargeId: string | null
	bulkCoupon: { id: string; maxUses: number; usedCount: number } | null
	product: { id: string; name: string }
}

type PersonalPurchase = {
	id: string
	product: {
		id: string
		name: string
	}
}

const Welcome: React.FC<
	React.PropsWithChildren<{
		purchase: Purchase
		existingPurchase: {
			id: string
			product: { id: string; name: string }
		}
		token: any
		availableUpgrades: { upgradableTo: { id: string; name: string } }[]
		upgrade: boolean
		product?: Product
		providers?: any
	}>
> = ({
	upgrade,
	purchase,
	token,
	existingPurchase,
	availableUpgrades,
	product,
	providers = {},
}) => {
	const { data: session, status } = useSession()
	const [personalPurchase, setPersonalPurchase] = React.useState<
		PersonalPurchase | Purchase
	>(purchase.bulkCoupon ? existingPurchase : purchase)

	const redemptionsLeft =
		purchase.bulkCoupon &&
		purchase.bulkCoupon.maxUses > purchase.bulkCoupon.usedCount

	const hasCharge = Boolean(purchase.merchantChargeId)

	const { data: purchaseUserTransfers, refetch } =
		api.purchaseUserTransfer.forPurchaseId.useQuery({
			id: purchase.id,
		})

	const isTransferAvailable =
		!purchase.bulkCoupon &&
		Boolean(
			purchaseUserTransfers?.filter(
				(purchaseUserTransfer: PurchaseUserTransfer) =>
					['AVAILABLE', 'INITIATED', 'COMPLETED'].includes(
						purchaseUserTransfer.transferState,
					),
			).length,
		)

	return (
		<div>
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
					/>
					<div className="flex flex-col gap-10">
						<div>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Introduction
							</h2>
							<MuxPlayer
								accentColor="#06b6d4"
								poster={
									'https://res.cloudinary.com/total-typescript/image/upload/v1676385817/welcome-video-thumbnail_2x_luri3y.png'
								}
								className="overflow-hidden rounded-md shadow-2xl shadow-black/30"
								playbackId="MP73OYRQ01024QL600kKBwdASaMc49me8008U4Il8og0202xE"
							/>
						</div>
						<div>
							<h2 className="pb-2 font-semibold uppercase tracking-wide">
								Share {process.env.NEXT_PUBLIC_SITE_TITLE}
							</h2>
							<Share productName={purchase.product.name} />
						</div>

						{redemptionsLeft && (
							<div>
								<h2 className="pb-2 font-semibold uppercase tracking-wide">
									Invite your team
								</h2>
								<Invite
									setPersonalPurchase={setPersonalPurchase}
									session={session}
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
								<Transfer
									purchaseUserTransfers={purchaseUserTransfers}
									refetch={refetch}
								/>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}

const Header: React.FC<
	React.PropsWithChildren<{
		upgrade: boolean
		purchase: Purchase
		personalPurchase?: PersonalPurchase | Purchase
		product?: Product
		providers?: any
	}>
> = ({ upgrade, purchase, product, personalPurchase, providers = {} }) => {
	const githubProvider = providers.github
	const { data: isGithubConnected, status } =
		api.users.githubConnected.useQuery()

	return (
		<header>
			<div className="flex flex-col items-center gap-10 pb-8 sm:flex-row">
				{product?.metadata.image && (
					<div className="flex flex-shrink-0 items-center justify-center">
						<Image
							src={product.metadata.image.url}
							alt={product.metadata.title}
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
						<Balancer>Total TypeScript {purchase.product.name}</Balancer>
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
								{githubProvider &&
								status !== 'loading' &&
								!isGithubConnected ? (
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
}) => {
	return (
		<InviteTeam
			setPersonalPurchase={setPersonalPurchase}
			session={session}
			purchase={purchase}
			existingPurchase={existingPurchase}
		/>
	)
}

const Share: React.FC<React.PropsWithChildren<{ productName: string }>> = ({
	productName,
}) => {
	const tweet = `https://twitter.com/intent/tweet/?text=Total TypeScript ${productName} by @${process.env.NEXT_PUBLIC_PARTNER_TWITTER} 🧙 ${process.env.NEXT_PUBLIC_URL}`
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

export default Welcome
