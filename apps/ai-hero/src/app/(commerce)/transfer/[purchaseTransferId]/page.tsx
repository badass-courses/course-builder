import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter } from '@/db'
import { acceptPurchaseTransfer } from '@/purchase-transfer/purchase-transfer-actions'
import { getServerAuthSession } from '@/server/auth'

const PurchaseTransferPage = async (props: {
	params: Promise<{ purchaseTransferId: string }>
}) => {
	const params = await props.params
	const { session } = await getServerAuthSession()
	const user = session?.user
	const purchaseTransfer =
		await courseBuilderAdapter.getPurchaseUserTransferById({
			id: params.purchaseTransferId,
		})

	const signedInAsTargetUser = user?.id === purchaseTransfer?.targetUserId

	return (
		<LayoutClient withContainer>
			<main className="mx-auto flex w-full grow flex-col items-center justify-center px-5 py-24 sm:py-32">
				{purchaseTransfer?.transferState === 'INITIATED' && (
					<div className="flex w-full max-w-xl flex-col gap-3">
						<h1 className="text-center text-3xl font-bold">
							👋 Welcome to {process.env.NEXT_PUBLIC_SITE_TITLE}
						</h1>
						<h2 className="text-center text-xl font-semibold">
							You've been invited by{' '}
							{purchaseTransfer?.sourceUser?.name ||
								purchaseTransfer?.sourceUser?.email ||
								''}{' '}
							to join {process.env.NEXT_PUBLIC_SITE_TITLE}
						</h2>
						{signedInAsTargetUser ? (
							<>
								<form
									action={async () => {
										'use server'
										user &&
											purchaseTransfer &&
											(await acceptPurchaseTransfer({
												purchaseUserTransferId: params.purchaseTransferId,
												email: user.email,
											}))
										revalidatePath(`/transfer/${params.purchaseTransferId}`)
										redirect(`/transfer/${params.purchaseTransferId}`)
									}}
								>
									<button
										type="submit"
										className="w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
										disabled={!purchaseTransfer}
									>
										accept this transfer
									</button>
								</form>
								<p className="text-center text-xs">
									By accepting this transfer you are agreeing to the{' '}
									<Link
										className="font-semibold hover:underline"
										href="/privacy"
									>
										terms and conditions of {process.env.NEXT_PUBLIC_SITE_TITLE}
									</Link>
									.
								</p>
							</>
						) : (
							<p className="text-center">
								In order to accept this invitation, you must be signed in as{' '}
								<span className="font-semibold underline">
									{purchaseTransfer?.targetUser?.email}
								</span>
								. Please sign in to the account tied to that email and revisit
								this URL to accept the transfer.
							</p>
						)}
					</div>
				)}
				{purchaseTransfer?.transferState === 'COMPLETED' && (
					<div className="flex w-full max-w-xl flex-col gap-3">
						<h1 className="text-center text-3xl font-bold">
							Purchase Transfer Completed
						</h1>
						<h2 className="text-center text-xl font-semibold">
							The license transfer from{' '}
							{purchaseTransfer?.sourceUser?.name ||
								purchaseTransfer?.sourceUser?.email ||
								''}{' '}
							has been completed.
						</h2>
					</div>
				)}
				{purchaseTransfer?.transferState === 'CANCELED' && (
					<div className="flex w-full max-w-xl flex-col gap-3">
						<h1 className="text-center text-3xl font-bold">
							Purchase Transfer Canceled
						</h1>
						<p className="text-center">
							The license transfer from{' '}
							<a
								className="font-semibold hover:underline"
								href={`mailto:${purchaseTransfer?.sourceUser?.email}`}
							>
								{purchaseTransfer?.sourceUser?.email}
							</a>{' '}
							has been canceled. Please contact them with any questions.
						</p>
					</div>
				)}
			</main>
		</LayoutClient>
	)
}

export default PurchaseTransferPage
