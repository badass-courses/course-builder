import * as React from 'react'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CreateTip } from '@/app/(content)/tips/_components/create-tip'
import { DeleteTipButton } from '@/app/(content)/tips/_components/delete-tip-button'
import { Layout } from '@/components/app/layout'
import { Icon } from '@/components/icons'
import ResourceContributor from '@/components/resource-contributor'
import { getTipsModule } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { CheckIcon } from '@heroicons/react/16/solid'

import { CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

const pageDescription = 'A collection of valuable Web Development tips.'

export const metadata = {
	title: 'Epic Web Dev Tips',
	description: pageDescription,
	openGraph: {
		images: [
			'https://res.cloudinary.com/epic-web/image/upload/v1704808424/card-tips_2x.png',
		],
	},
}

export default async function TipsListPage() {
	return (
		<Layout>
			<Suspense>
				<TipListActions />
			</Suspense>
			<header className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-3 px-5 py-16 text-center">
				<h1 className="mx-auto text-center text-4xl font-semibold">Tips</h1>
				<h2 className="w-full max-w-md text-base text-gray-600 dark:text-indigo-200/60">
					<div className="text-balance">{pageDescription}</div>
				</h2>
			</header>
			<main className="relative z-10 flex flex-col items-center justify-center">
				<div className="mx-auto flex w-full max-w-screen-lg flex-col gap-0 sm:gap-3 sm:px-5">
					<TipList />
				</div>
			</main>
		</Layout>
	)
}

async function TipList() {
	const tipsModule = await getTipsModule()
	const { ability } = await getServerAuthSession()
	// TODO: implement resource completion functionality
	const resourceCompleted = true
	return (
		<>
			{tipsModule.map((tip, i) => {
				const muxPlaybackId = tip.resources?.[0]?.resource.fields?.muxPlaybackId
				const thumbnail = `https://image.mux.com/${muxPlaybackId}/thumbnail.png?width=720&height=405&fit_mode=preserve`
				return (
					<Link
						key={tip.id}
						className={cn(
							'group relative flex flex-row items-center overflow-hidden rounded',
							{
								'bg-card': i % 2 === 0,
							},
						)}
						href={`/tips/${tip.fields.slug}`}
					>
						<CardHeader className="relative hidden aspect-video w-full max-w-[100px] items-center justify-center sm:flex sm:max-w-[200px]">
							<div className=" flex items-center justify-center">
								<span className="sr-only">
									Play {tip.fields.title}{' '}
									{resourceCompleted && (
										<span className="sr-only">(completed)</span>
									)}
								</span>
								<div className="flex w-full items-center justify-center">
									<Image
										src={thumbnail}
										alt=""
										objectFit="cover"
										layout="fill"
										aria-hidden="true"
										className="brightness-90 transition duration-300 group-hover:brightness-75 dark:brightness-50"
									/>
								</div>
								<div
									className="absolute flex items-center justify-center rounded-full text-white opacity-100 drop-shadow-xl duration-500 ease-in-out group-hover:opacity-100"
									aria-hidden="true"
								>
									<Icon className="h-6 w-6" name="Playmark" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex h-full w-full flex-col px-6  py-4">
							<div
								className="absolute right-5 top-5 z-20 flex items-center gap-2"
								aria-hidden="true"
							>
								{resourceCompleted && (
									<CheckIcon className="w-4" aria-label="Watched" />
								)}
							</div>
							<h2 className="text-base font-semibold leading-tight sm:text-lg">
								{tip.fields.title}{' '}
								{resourceCompleted && (
									<span className="sr-only">(watched)</span>
								)}
							</h2>
							<ResourceContributor
								// TODO: extend tip data with instructor data
								// name={tip?.instructor?.name}
								// slug={tip?.instructor?.slug}
								// image={tip?.instructor?.picture?.url}
								as="div"
								className="mt-3 gap-2 text-sm font-normal opacity-75 [&_img]:w-8"
							/>
						</CardContent>
						{ability.can('delete', 'Content') && (
							<CardFooter>
								<div className="absolute bottom-4 right-4">
									<DeleteTipButton id={tip.id} />
								</div>
							</CardFooter>
						)}
					</Link>
				)
			})}
		</>
	)
}

async function TipListActions() {
	const { ability } = await getServerAuthSession()
	return (
		<>
			{ability.can('create', 'Content') ? (
				<div className="order-1 h-full flex-grow md:order-2">
					<h1 className="pb-2 text-lg font-bold">Create Tip</h1>
					<CreateTip />
				</div>
			) : null}
		</>
	)
}
