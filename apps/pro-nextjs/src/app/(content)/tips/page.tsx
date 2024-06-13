import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import { CreateTip } from '@/app/(content)/tips/_components/create-tip'
import { DeleteTipButton } from '@/app/(content)/tips/_components/delete-tip-button'
import config from '@/config'
import { env } from '@/env.mjs'
import { getTipsModule } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `Next.js Tips by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Next.js Tips by ${config.author}`)}`,
			},
		],
	},
}

export default async function TipsListPage() {
	return (
		<main className="container relative flex h-full min-h-[calc(100vh-var(--nav-height))] flex-col items-center px-0 lg:border-x">
			<div className="w-full max-w-screen-md border-b py-16">
				<h1 className="font-heading fluid-3xl text-center font-medium">
					Pro Next.js Tips
				</h1>
			</div>
			<TipList />
			<Suspense>
				<TipListActions />
			</Suspense>
			<div
				className="absolute top-0 -z-10 h-full w-full max-w-screen-md md:border-x"
				aria-hidden="true"
			/>
		</main>
	)
}

async function TipList() {
	const tipsModule = await getTipsModule()
	const { ability } = await getServerAuthSession()
	const tips = [...tipsModule].filter((tip) => {
		if (ability.can('create', 'Content')) {
			return tip
		} else {
			return tip.fields.visibility === 'public'
		}
	})
	const publicTips = [...tipsModule].filter(
		(tip) => tip.fields.visibility === 'public',
	)

	return (
		<ul className="mx-auto mt-8 flex w-full max-w-screen-md flex-col gap-5 px-5 md:px-8">
			{publicTips.length === 0 && <p>There are no public tips.</p>}
			{tips.map((tip) => (
				<li key={tip.id}>
					<Card className="bg-background rounded-none border-none p-0">
						<CardHeader className="p-0">
							<CardTitle className="fluid-xl font-semibold sm:text-2xl">
								<Link
									className="hover:text-primary w-full"
									href={`/tips/${tip.fields.slug || tip.id}`}
								>
									{tip.fields.title}
								</Link>
							</CardTitle>
						</CardHeader>
						{tip.fields.description && (
							<CardContent className="px-0 py-3">
								<p className="text-muted-foreground text-sm">
									{tip.fields.description}
								</p>
							</CardContent>
						)}
						<CardFooter className="flex items-center justify-between gap-3 px-0 py-3">
							<Contributor className="text-sm font-light" />
							<div className="flex items-center gap-2">
								{ability.can('create', 'Content') && (
									<>
										<span className="text-sm">{tip.fields.visibility}</span>
										<Button asChild variant="outline" size="sm">
											<Link href={`/tips/${tip.fields.slug || tip.id}/edit`}>
												Edit
											</Link>
										</Button>
									</>
								)}
								{ability.can('delete', 'Content') && (
									<DeleteTipButton id={tip.id} />
								)}
							</div>
						</CardFooter>
					</Card>
				</li>
			))}
		</ul>
	)
}

async function TipListActions() {
	const { ability } = await getServerAuthSession()
	return ability.can('create', 'Content') ? <CreateTip /> : null
}
