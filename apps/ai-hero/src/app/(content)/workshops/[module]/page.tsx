import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { EditWorkshopButton } from '@/app/(content)/workshops/_components/edit-workshop-button'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'
import {
	ContentTitle,
	GetAccessButton,
	StartLearningWorkshopButton,
	StartLearningWorkshopButtonSkeleton,
	WorkshopGitHubRepoLink,
} from '@/app/(content)/workshops/_components/workshop-user-actions'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import Spinner from '@/components/spinner'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { getCachedMinimalWorkshop } from '@/lib/workshops-query'
import { getProviders } from '@/server/auth'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'
import { Construction, Github, Share2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Course } from 'schema-dts'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
	Skeleton,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { ConnectToDiscord } from '../_components/connect-to-discord'
import WorkshopBreadcrumb from '../_components/workshop-breadcrumb'
import WorkshopImage from '../_components/workshop-image'

type Props = {
	params: Promise<{ module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
	const workshops = await db.query.contentResource.findMany({
		where: and(eq(contentResource.type, 'workshop')),
	})

	return workshops
		.filter((workshop) => Boolean(workshop.fields?.slug))
		.map((workshop) => ({
			module: workshop.fields?.slug,
		}))
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields?.title,
		description: workshop.fields?.description,
		openGraph: {
			images: [
				getOGImageUrlForResource(
					workshop as unknown as ContentResource & {
						fields?: { slug: string }
					},
				),
			],
		},
	}
}

export default async function ModulePage(props: Props) {
	const searchParams = await props.searchParams
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	const abilityLoader = getAbilityForResource(undefined, params.module)

	if (!workshop) {
		notFound()
	}

	const providers = getProviders()
	const discordProvider = providers?.discord
	const Links = ({ children }: { children?: React.ReactNode }) => {
		return (
			<div className="relative w-full grid-cols-6 items-center border-y md:grid">
				<div
					aria-hidden="true"
					className="via-foreground/10 to-muted absolute -bottom-px right-0 h-px w-2/3 bg-gradient-to-r from-transparent"
				/>
				<div className="divide-border col-span-4 flex flex-wrap items-center divide-y md:divide-y-0">
					<div className="h-14 bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-[length:24px_32px] bg-repeat sm:w-8 lg:w-10  dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)] dark:bg-[length:24px_32px]" />

					<React.Suspense fallback={<StartLearningWorkshopButtonSkeleton />}>
						<GetAccessButton abilityLoader={abilityLoader} />
						<StartLearningWorkshopButton
							abilityLoader={abilityLoader}
							moduleSlug={params.module}
							workshop={workshop}
						/>
						<div className="w-full items-center sm:flex sm:w-auto">
							<WorkshopGitHubRepoLink githubUrl={workshop.fields?.githubUrl} />
							<Dialog>
								<DialogTrigger asChild>
									<Button
										className="h-14 w-full rounded-none px-5 md:w-auto md:border-r"
										variant="ghost"
										size="lg"
									>
										<Share2 className="mr-2 w-3" /> Share
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Share {workshop.fields?.title}</DialogTitle>
									<Share />
								</DialogContent>
							</Dialog>
						</div>
					</React.Suspense>
					<React.Suspense fallback={null}>
						<ConnectToDiscord discordProvider={discordProvider} />
					</React.Suspense>
				</div>
				{children}
			</div>
		)
	}
	const squareGridPattern = generateGridPattern(
		workshop.fields?.title || '',
		1000,
		800,
		0.8,
		true,
	)
	return (
		<LayoutClient withContainer>
			<main className="flex min-h-screen w-full flex-col">
				{workshop.fields?.visibility !== 'public' && (
					<div className="flex w-full items-center justify-center gap-2 border-b bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-[length:24px_32px] bg-repeat p-3 text-center dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)] dark:bg-[length:24px_32px]">
						<Construction className="h-4 w-4" />{' '}
						<p className="text-sm font-medium capitalize">
							{workshop.fields?.visibility} {workshop.type}
						</p>
					</div>
				)}
				<WorkshopMetadata
					title={workshop.fields?.title || ''}
					description={workshop.fields?.description || ''}
					imageUrl={workshop.fields?.coverImage?.url}
					slug={params.module}
				/>
				<header className="relative flex items-center justify-center overflow-hidden md:px-8 lg:px-10">
					<div className="relative z-10 mx-auto flex h-full w-full flex-col-reverse items-center justify-between gap-5 pb-10 md:grid md:grid-cols-5 md:gap-10 md:pt-10 lg:gap-5">
						<div className="col-span-3 flex flex-shrink-0 flex-col items-center px-5 md:items-start md:px-0">
							<WorkshopBreadcrumb />
							{/* <p className="text-primary mb-2 text-base">Pro Workshop</p> */}
							<h1 className="fluid-3xl w-full text-center font-bold tracking-tight md:text-left dark:text-white">
								{workshop.fields?.title}
							</h1>
							{workshop.fields?.description && (
								<div className="prose prose-p:text-balance md:prose-p:text-left prose-p:text-center prose-p:font-normal sm:prose-lg lg:prose-xl">
									<p>{workshop.fields?.description}</p>
								</div>
							)}
							<div className="mt-5 flex items-center gap-2">
								<Contributor />
							</div>
						</div>
						<div className="col-span-2">
							{workshop.fields?.coverImage?.url && (
								<WorkshopImage imageUrl={workshop.fields.coverImage.url} />
							)}
						</div>
						<Suspense fallback={null}>
							<EditWorkshopButton
								className="absolute right-0 top-5"
								moduleType="workshop"
								moduleSlug={params.module}
							/>
						</Suspense>
					</div>
					<div className={cn('absolute right-0 top-0 z-0 w-full', {})}>
						<img
							src={squareGridPattern}
							alt=""
							aria-hidden="true"
							className="hidden h-[320px] w-full overflow-hidden object-cover object-right-top opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
						/>
						<div
							className="to-background via-background absolute left-0 top-0 z-10 h-full w-full bg-gradient-to-bl from-transparent"
							aria-hidden="true"
						/>
					</div>
				</header>

				<>
					<Links>
						{/* <React.Suspense fallback={null}> */}
						<ContentTitle
						// abilityLoader={abilityLoader}
						/>
						{/* </React.Suspense> */}
					</Links>
					<div className="mx-auto flex w-full flex-grow grid-cols-6 flex-col md:grid">
						<article className="prose sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl col-span-4 max-w-none px-5 py-10 sm:px-8 lg:px-10 [&_[data-pre]]:max-w-4xl">
							{workshop.fields?.body ? (
								<ReactMarkdown>{workshop.fields.body}</ReactMarkdown>
							) : (
								<p>No description found.</p>
							)}
						</article>
						<div className="bg-muted/50 col-span-2 flex flex-col border-l">
							{/* <React.Suspense
								fallback={
									<div className="flex flex-col gap-2">
										{new Array(1).fill(null).map((_, i) => (
											<Skeleton
												key={`skeleton-${i}`}
												className="flex h-80 w-full items-center justify-center"
											>
												<Spinner className="size-4" />
											</Skeleton>
										))}
									</div>
								}
							>
								<WorkshopPricing
									searchParams={searchParams}
									moduleSlug={params.module}
								>
									{(pricingProps) => {
										return pricingProps.hasPurchasedCurrentProduct ? null : (
											<>
												<WorkshopPricingClient
													{...pricingProps}
													searchParams={props.searchParams}
												/>
												<div className="col-span-2 hidden h-14 items-center border-b pl-5 text-base font-medium md:flex">
													Content
												</div>
											</>
										)
									}}
								</WorkshopPricing>
								</React.Suspense> */}

							<WorkshopResourceList
								isCollapsible={false}
								className="w-full max-w-none !border-r-0"
								withHeader={false}
								maxHeight="h-auto"
								wrapperClassName="overflow-hidden pb-0"
							/>
							{/* <React.Suspense fallback={null}>
								<SmallCohortBanner abilityLoader={abilityLoader} />
							</React.Suspense> */}
						</div>
					</div>
					{workshop?.fields?.body && <Links />}
				</>
			</main>
		</LayoutClient>
	)
}

const WorkshopMetadata = ({
	title,
	description,
	imageUrl,
	slug,
}: {
	title: string
	description: string
	imageUrl?: string
	slug: string
}) => {
	const jsonLd: Course = {
		'@type': 'Course',
		name: title,
		author: config.author,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: description,
		...(imageUrl && { thumbnailUrl: imageUrl }),
		url: `${env.NEXT_PUBLIC_URL}/workshops/${slug}`,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
