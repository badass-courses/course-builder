import Link from 'next/link'
import { db } from '@/db'
import { getFormSubscribers } from '@/lib/kit-query'
import { getPostsWithCompletionCounts } from '@/lib/posts-query'
import { getProductsWithPurchaseCounts } from '@/lib/products/products.service'
import { format } from 'date-fns'

import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default async function AdminDashboardPage() {
	const formSubscriptions = await getFormSubscribers()
	const registeredUsers = await db.query.users.findMany({
		columns: {
			id: true,
		},
	})
	const totalRegisteredUsersCount = registeredUsers.length
	const productsWithPurchases = await getProductsWithPurchaseCounts()
	const totalPurchases = productsWithPurchases.reduce(
		(sum, product) => Number(sum) + Number(product.validPurchaseCount),
		0,
	)
	const postsWithCompletions = await getPostsWithCompletionCounts()

	return (
		<div className="mx-auto w-full max-w-screen-lg">
			<div className="mb-8 grid grid-cols-3 items-center gap-5">
				<div className="bg-card flex aspect-square h-full w-full flex-col items-center justify-center gap-1 rounded-lg border p-5 shadow sm:gap-2">
					<div className="text-3xl font-semibold tabular-nums sm:text-4xl">
						{formSubscriptions.total_count.toLocaleString()}
					</div>
					<div className="text-center font-mono text-xs font-semibold uppercase tracking-wide">
						Active subscribers
					</div>
					<div
						className={cn(
							'hidden text-center text-xs font-semibold uppercase tracking-wide sm:block',
							{
								'rounded-md bg-teal-500/20 px-2 py-1 text-teal-600 dark:text-teal-200':
									formSubscriptions.subscribers_added_last_week > 0,
							},
						)}
					>
						+{formSubscriptions.subscribers_added_last_week.toLocaleString()}{' '}
						last week
					</div>
				</div>

				<div className="bg-card flex aspect-square h-full w-full flex-col items-center justify-center gap-1 rounded-lg border p-5 shadow sm:gap-2">
					<div className="text-3xl font-semibold tabular-nums sm:text-4xl">
						{totalRegisteredUsersCount.toLocaleString()}
					</div>
					<div className="text-center font-mono text-xs font-semibold uppercase tracking-wide">
						Registered users
					</div>
				</div>

				<div className="bg-card flex aspect-square h-full w-full flex-col items-center justify-center gap-1 rounded-lg border p-5 shadow sm:gap-2">
					<div className="text-3xl font-semibold tabular-nums sm:text-4xl">
						{totalPurchases.toLocaleString()}
					</div>
					<div className="text-center font-mono text-xs font-semibold uppercase tracking-wide">
						Total purchases
					</div>
				</div>
			</div>

			<div className="mb-8">
				<h2 className="mb-4 text-2xl font-semibold">Products & Sales</h2>
				<div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
					{productsWithPurchases.map((product) => (
						<Link
							href={`/products/${product.slug}`}
							key={product.id}
							className="bg-card border-border relative rounded-lg border p-4 transition-all ease-in-out hover:-translate-y-1 hover:shadow"
						>
							<div className="mb-2 flex items-start justify-between">
								<h3 className="text-sm font-semibold leading-tight">
									{product.name}
								</h3>
								<span className="text-muted-foreground text-xs capitalize">
									{product.type}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="text-2xl font-semibold tabular-nums">
									{Number(product.validPurchaseCount).toLocaleString()}
								</div>
								{product.type === 'live' && (
									<div className="text-muted-foreground text-xs">
										{Number(product.quantityAvailable) === -1
											? 'Unlimited'
											: `${Number(product.quantityAvailable)} seats`}
									</div>
								)}
							</div>
							<div className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-wide">
								purchases
							</div>
						</Link>
					))}
				</div>
			</div>

			<div className="mb-8">
				<h2 className="mb-4 text-2xl font-semibold">Posts & Completions</h2>
				<div className="grid grid-cols-1 gap-2">
					{postsWithCompletions.map((post) => (
						<Link
							href={getResourcePath(
								String(post.postType),
								String(post.slug),
								'view',
							)}
							key={post.id}
							className="bg-card border-border relative flex items-center justify-between rounded-lg border p-4 transition-all ease-in-out hover:-translate-y-1 hover:shadow"
						>
							<div className="flex items-center gap-5">
								<div className="min-w-[3ch] text-center text-2xl font-semibold tabular-nums">
									{Number(post.completionCount).toLocaleString()}
								</div>
								<h3 className="text-base font-semibold leading-tight">
									{String(post.title)}
								</h3>
							</div>
							<div className="flex flex-col items-end gap-1 text-right">
								<span className="text-muted-foreground text-xs capitalize">
									{String(post.postType)}
								</span>
								<div className="text-muted-foreground text-xs capitalize">
									{String(post.state)}{' '}
									{format(new Date(String(post.createdAt)), 'MMM do, yyyy')}
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}
