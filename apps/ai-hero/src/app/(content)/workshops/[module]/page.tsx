import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
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
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import {
	getCachedMinimalWorkshop,
	getCachedWorkshopProduct,
} from '@/lib/workshops-query'
import { getProviders } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'
import { Construction, Share2 } from 'lucide-react'
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
import { InlineBuyButton } from '../_components/inline-mdx-pricing'
import WorkshopBreadcrumb from '../_components/workshop-breadcrumb'
import WorkshopImage from '../_components/workshop-image'
import { WorkshopPricingClient } from '../_components/workshop-pricing'
import { WorkshopPricing } from '../_components/workshop-pricing-server'
import { WorkshopSidebar } from '../_components/workshop-sidebar'
import { Certificate } from '../../_components/module-certificate-container'

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
				{
					url: `${env.NEXT_PUBLIC_URL}/api/og/default?title=${workshop.fields?.title}`,
				},
				// getOGImageUrlForResource(
				// 	workshop as unknown as ContentResource & {
				// 		fields?: { slug: string }
				// 	},
				// ),
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
	const Links = ({
		children,
		className,
	}: {
		children?: React.ReactNode
		className?: string
	}) => {
		return (
			<div
				className={cn(
					'relative w-full grid-cols-6 items-center border-y md:grid',
					className,
				)}
			>
				<div
					aria-hidden="true"
					className="via-foreground/10 to-muted bg-linear-to-r absolute -bottom-px right-0 h-px w-2/3 from-transparent"
				/>
				<div className="divide-border col-span-4 flex flex-wrap items-center divide-y md:divide-y-0">
					<div className="bg-size-[24px_32px] dark:bg-size-[24px_32px] h-14 bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-repeat sm:w-8 lg:w-10 dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)]" />

					<React.Suspense fallback={<StartLearningWorkshopButtonSkeleton />}>
						<GetAccessButton abilityLoader={abilityLoader} />
						<StartLearningWorkshopButton
							productType={product?.type}
							abilityLoader={abilityLoader}
							moduleSlug={params.module}
							workshop={workshop}
						/>
						<div className="divide-border w-full items-center divide-y sm:flex sm:w-auto sm:divide-y-0">
							{workshop.fields?.github ? (
								<WorkshopGitHubRepoLink
									githubUrl={workshop.fields?.github}
									abilityLoader={abilityLoader}
								/>
							) : null}
							<Dialog>
								<DialogTrigger asChild>
									<Button
										className="h-14 w-full rounded-none px-5 md:w-auto md:border-r"
										variant="ghost"
										size="lg"
									>
										<Share2 className="mr-1 w-3" /> Share
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
						<ConnectToDiscord
							discordProvider={discordProvider}
							abilityLoader={abilityLoader}
						/>
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
	const product = await getCachedWorkshopProduct(params.module)
	const { content: body } = await compileMDX(workshop.fields.body || '', {
		EnrollNow: (props) => (
			<WorkshopPricing moduleSlug={params.module} searchParams={searchParams}>
				{(workshopProps) => (
					<InlineBuyButton
						resource={workshop}
						pricingDataLoader={workshopProps.pricingDataLoader}
						pricingProps={workshopProps as any}
						centered={false}
						resourceType="workshop"
						pricingOptions={{
							withTitle: false,
							withImage: false,
						}}
					/>
				)}
			</WorkshopPricing>
		),
	})

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-screen w-full flex-col">
				{workshop.fields?.visibility !== 'public' && (
					<div className="bg-size-[24px_32px] dark:bg-size-[24px_32px] relative flex w-full items-center justify-center gap-2 border-b bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-repeat p-3 text-center dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)]">
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
						<div className="col-span-3 flex shrink-0 flex-col items-center px-5 md:items-start md:px-0">
							<WorkshopBreadcrumb />
							<h1 className="w-full text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-left lg:text-5xl dark:text-white">
								{workshop.fields?.title}
							</h1>
							{workshop.fields?.description && (
								<div className="prose prose-p:text-balance dark:prose-invert md:prose-p:text-left prose-p:text-center prose-p:font-normal sm:prose-lg lg:prose-xl mt-3 leading-tight">
									<p>{workshop.fields?.description}</p>
								</div>
							)}
							<div className="mt-5 flex items-center gap-2">
								<Contributor />
							</div>
						</div>
						<div className="col-span-2">
							{workshop.fields?.coverImage?.url && (
								<WorkshopImage
									imageUrl={workshop.fields.coverImage.url}
									abilityLoader={abilityLoader}
								/>
							)}
						</div>
					</div>
					<div className={cn('absolute right-0 top-0 z-0 w-full', {})}>
						<img
							src={squareGridPattern}
							alt=""
							aria-hidden="true"
							className="object-top-right hidden h-[320px] w-full overflow-hidden object-cover opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
						/>
						<div
							className="to-background via-background bg-linear-to-bl absolute left-0 top-0 z-10 h-full w-full from-transparent"
							aria-hidden="true"
						/>
					</div>
					<Suspense fallback={null}>
						<EditWorkshopButton
							className="absolute right-5 top-5 z-10"
							moduleType="workshop"
							moduleSlug={params.module}
							product={product}
						/>
					</Suspense>
				</header>

				<>
					<Links>
						<ContentTitle />
					</Links>
					<div className="mx-auto flex w-full grow grid-cols-6 flex-col md:grid">
						<div className="col-span-4 border-b px-5 pb-2 pt-10 sm:px-8 md:border-b-0 md:py-10 lg:px-10">
							<article className="prose dark:prose-invert sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none">
								{workshop.fields?.body ? body : <p>No description found.</p>}
							</article>
							{product?.type === 'self-paced' && (
								<div className="">
									<hr className="border-border mb-6 mt-8 w-full border-dashed" />
									<h3 className="mb-3 mt-5 text-xl font-bold sm:text-2xl">
										Content
									</h3>
									<WorkshopResourceList
										isCollapsible={false}
										className="border-r-0! [&_button]:rounded-none! w-full max-w-none [&_ol>li]:last-of-type:[&_button]:border-b-0"
										withHeader={false}
										maxHeight="h-auto"
										wrapperClassName="overflow-hidden pb-0 rounded-lg border border-border"
									/>
								</div>
							)}
						</div>
						<div className="bg-muted/50 col-span-2 flex h-full flex-col md:border-l">
							{product?.type === 'self-paced' ? (
								<React.Suspense
									fallback={
										<div className="bg-background relative z-10 flex w-full flex-col gap-2 p-5 pb-16 md:-mt-14">
											<Skeleton className="bg-accent h-10 w-full" />
											<Skeleton className="bg-accent h-10 w-full" />
											<Skeleton className="bg-accent h-10 w-full" />
											<Skeleton className="bg-accent h-10 w-full" />
										</div>
									}
								>
									<WorkshopPricing
										moduleSlug={params.module}
										searchParams={searchParams}
									>
										{(pricingProps) => {
											return pricingProps.product ? (
												<>
													<WorkshopSidebar
														pricingProps={pricingProps}
														workshop={workshop}
													>
														{pricingProps.allowPurchase &&
														!pricingProps.hasPurchasedCurrentProduct ? (
															<>
																<WorkshopPricingClient
																	className="bg-background relative z-10 md:-mt-14"
																	searchParams={props.searchParams}
																	{...pricingProps}
																/>
															</>
														) : (
															<>
																<WorkshopResourceList
																	isCollapsible={false}
																	className="border-r-0! w-full max-w-none"
																	withHeader={false}
																	maxHeight="h-auto"
																	wrapperClassName="overflow-hidden pb-0 hidden md:block"
																/>
																<div className="p-3">
																	<Certificate
																		resourceSlugOrId={params.module}
																	/>
																</div>
															</>
														)}
													</WorkshopSidebar>
												</>
											) : (
												<WorkshopResourceList
													isCollapsible={false}
													className="border-r-0! w-full max-w-none"
													withHeader={false}
													maxHeight="h-auto"
													wrapperClassName="overflow-hidden pb-0"
												/>
											)
										}}
									</WorkshopPricing>
								</React.Suspense>
							) : (
								<WorkshopSidebar workshop={workshop}>
									<WorkshopResourceList
										isCollapsible={false}
										className="border-r-0! w-full max-w-none"
										withHeader={false}
										maxHeight="h-auto"
										wrapperClassName="overflow-hidden pb-0"
									/>
								</WorkshopSidebar>
							)}
						</div>
					</div>
					{workshop?.fields?.body && <Links className="border-b-0" />}
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
