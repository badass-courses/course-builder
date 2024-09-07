import * as React from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { db } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { and } from 'drizzle-orm'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()
	const products = await db.query.products.findMany({
		where: (products, { eq, and }) =>
			and(eq(products.status, 1), eq(products.type, 'self-paced')),
	})

	return (
		<Layout>
			<div className="flex w-full flex-col">
				<div
					className={cn('mx-auto w-full pb-24 pt-10', {
						// 'pt-[var(--nav-height)]': !videoResourceId,
						// 'pt-8': videoResourceId,
					})}
				>
					{ability.can('update', 'Content') ? (
						<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
							<div />
							<Button asChild className="h-7">
								<Link href={`/products/new`}>New Product</Link>
							</Button>
						</div>
					) : null}
					<div className="flex flex-col space-y-4 p-5 sm:p-10">
						<h2 className="text-lg font-bold">Products</h2>
						{products.map((product) => (
							<Card key={product.id}>
								<CardHeader>
									<CardTitle>
										<Link
											href={`/products/${product.fields?.slug || product.id}`}
										>
											{product.name}
										</Link>
									</CardTitle>
								</CardHeader>
								<CardContent></CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		</Layout>
	)
}
