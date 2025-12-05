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
import MDXVideo from '@/components/content/mdx-video'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import Spinner from '@/components/spinner'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import {
	getAllWorkshopsInProduct,
	getCachedMinimalWorkshop,
	getCachedWorkshopProduct,
} from '@/lib/workshops-query'
import { getProviders } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
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
	TooltipProvider,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { ConnectToDiscord } from '../_components/connect-to-discord'
import { MultiWorkshopContent } from '../_components/multi-workshop-content'
import { WorkshopBodyWithPricing } from '../_components/workshop-body-with-pricing'
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
				workshop.fields?.coverImage?.url
					? {
							url: workshop.fields?.coverImage?.url,
							alt: workshop.fields?.title,
						}
					: getOGImageUrlForResource(
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
					'relative flex w-full items-center justify-center md:h-12 md:justify-start',
					className,
				)}
			>
				<div className="flex h-full w-full flex-wrap items-center justify-center gap-2 md:justify-start">
					<React.Suspense fallback={<StartLearningWorkshopButtonSkeleton />}>
						<GetAccessButton abilityLoader={abilityLoader} />
						<StartLearningWorkshopButton
							productType={product?.type}
							abilityLoader={abilityLoader}
							moduleSlug={params.module}
							workshop={workshop}
						/>
						<WorkshopGitHubRepoLink
							abilityLoader={abilityLoader}
							githubUrl={workshop.fields?.github}
						/>
						<div className="w-full items-center gap-2 sm:flex md:w-auto">
							<Dialog>
								<DialogTrigger asChild>
									<Button
										className="hover:text-primary text-primary h-12 w-full rounded-lg border px-4 shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] ease-out md:w-auto"
										variant="ghost"
										size="lg"
									>
										<Share2 className="w-3" /> Share
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

	const product = await getCachedWorkshopProduct(params.module)
	// Check if this is a multi-workshop product
	const isMultiWorkshopProduct =
		params.module === 'epic-mcp-from-scratch-to-production'
	const allWorkshopsInProduct = isMultiWorkshopProduct
		? await getAllWorkshopsInProduct(params.module)
		: []

	// For self-paced products, body is compiled inside WorkshopPricing with pricing-aware components
	// For other products, compile body here without pricing context
	const { content: body } =
		product?.type !== 'self-paced'
			? await compileMDX(workshop.fields?.body || '')
			: { content: null }

	return (
		<LayoutClient withContainer>
			<main className="flex w-full flex-col pb-24">
				{workshop.fields?.visibility !== 'public' && (
					<div className="flex w-full items-center justify-center gap-2 rounded-lg border p-3 text-center">
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

				{product?.type === 'self-paced' ? (
					<WorkshopPricing
						moduleSlug={params.module}
						searchParams={searchParams}
					>
						{(pricingProps) => (
							<div className="mx-auto flex w-full grow grid-cols-8 flex-col gap-5 md:grid lg:gap-10">
								<div className="col-span-5">
									<header className="flex shrink-0 flex-col items-center pb-10 pt-6 md:items-start">
										{workshop.fields?.coverImage?.url && (
											<div className="mb-5 flex md:hidden">
												{/* <WorkshopImage
													imageUrl={workshop.fields.coverImage.url}
													abilityLoader={abilityLoader}
												/> */}
												{product.type === 'self-paced' &&
												!pricingProps.hasPurchasedCurrentProduct ? (
													<MDXVideo
														poster={workshop.fields?.coverImage?.url}
														resourceId="introducingepicmcp-m6nYgLXNm.mp4"
														className="mb-0 border-none"
													/>
												) : (
													workshop.fields?.coverImage?.url && (
														<WorkshopImage
															imageUrl={workshop.fields.coverImage.url}
															abilityLoader={abilityLoader}
														/>
													)
												)}
											</div>
										)}
										<WorkshopBreadcrumb />
										<h1 className="fluid-3xl w-full text-center font-bold tracking-tight md:text-left dark:text-white">
											{workshop.fields?.title}
										</h1>
										{workshop.fields?.description && (
											<div className="prose prose-p:text-balance md:prose-p:text-left prose-p:text-center prose-p:font-normal sm:prose-base lg:prose-lg mt-3">
												<p>{workshop.fields?.description}</p>
											</div>
										)}
										<Links className="mt-5" />
									</header>
									<article className="prose sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none pt-5">
										<WorkshopBodyWithPricing
											rawBody={workshop.fields?.body || ''}
											pricingProps={pricingProps}
										/>
									</article>
									<div className="">
										<hr className="border-border mb-6 mt-8 w-full border-dashed" />
										<h3 className="mb-3 mt-5 text-xl font-bold sm:text-2xl">
											Content
										</h3>
										{isMultiWorkshopProduct &&
										allWorkshopsInProduct.length > 1 ? (
											<div className="border-border overflow-hidden rounded-lg border pb-0">
												<MultiWorkshopContent />
											</div>
										) : (
											<WorkshopResourceList
												isCollapsible={false}
												className="border-r-0! [&_button]:rounded-none! w-full max-w-none [&_ol>li]:last-of-type:[&_button]:border-b-0"
												withHeader={false}
												maxHeight="h-auto"
												wrapperClassName="overflow-hidden pb-0 rounded-lg border border-border"
											/>
										)}
									</div>
								</div>

								<div className="relative col-span-3 flex h-full flex-col pt-2">
									<Suspense fallback={null}>
										<EditWorkshopButton
											className="absolute right-2 top-4 z-10"
											moduleType="workshop"
											moduleSlug={params.module}
											product={product}
										/>
									</Suspense>
									{pricingProps.product ? (
										<WorkshopSidebar
											productType={product?.type}
											workshop={workshop}
										>
											{pricingProps.product.type === 'self-paced' &&
											!pricingProps.hasPurchasedCurrentProduct ? (
												<MDXVideo
													poster={workshop.fields?.coverImage?.url}
													resourceId="introducingepicmcp-m6nYgLXNm.mp4"
													className="mb-0 rounded-b-none border-none"
												/>
											) : (
												workshop.fields?.coverImage?.url && (
													<WorkshopImage
														className="rounded-b-none"
														imageUrl={workshop.fields.coverImage.url}
														abilityLoader={abilityLoader}
													/>
												)
											)}

											{pricingProps.allowPurchase &&
											!pricingProps.hasPurchasedCurrentProduct ? (
												<WorkshopPricingClient
													className="relative z-10 border-b-0 pt-0"
													searchParams={props.searchParams}
													{...pricingProps}
												/>
											) : (
												<>
													{isMultiWorkshopProduct &&
													allWorkshopsInProduct.length > 1 ? (
														<div className="hidden overflow-hidden pb-0 md:block">
															<MultiWorkshopContent />
														</div>
													) : (
														<WorkshopResourceList
															isCollapsible={false}
															className="border-r-0! w-full max-w-none"
															withHeader={false}
															maxHeight="h-auto"
															wrapperClassName="overflow-hidden pb-0 hidden md:block"
														/>
													)}
													{pricingProps.hasPurchasedCurrentProduct && (
														<div className="p-3">
															<Certificate resourceSlugOrId={params.module} />
														</div>
													)}
												</>
											)}
										</WorkshopSidebar>
									) : (
										<>
											{workshop.fields?.coverImage?.url && (
												<WorkshopImage
													imageUrl={workshop.fields.coverImage.url}
													abilityLoader={abilityLoader}
												/>
											)}
											<WorkshopResourceList
												isCollapsible={false}
												className="border-r-0! w-full max-w-none"
												withHeader={false}
												maxHeight="h-auto"
												wrapperClassName="overflow-hidden pb-0"
											/>
										</>
									)}
								</div>
							</div>
						)}
					</WorkshopPricing>
				) : (
					<div className="mx-auto flex w-full grow grid-cols-8 flex-col gap-5 md:grid lg:gap-10">
						<div className="col-span-5">
							<header className="flex shrink-0 flex-col items-center pb-10 pt-6 md:items-start">
								{workshop.fields?.coverImage?.url && (
									<div className="mb-5 flex md:hidden">
										<WorkshopImage
											imageUrl={workshop.fields.coverImage.url}
											abilityLoader={abilityLoader}
										/>
									</div>
								)}
								<WorkshopBreadcrumb />
								<h1 className="fluid-3xl w-full text-center font-bold tracking-tight md:text-left dark:text-white">
									{workshop.fields?.title}
								</h1>
								{workshop.fields?.description && (
									<div className="prose prose-p:text-balance md:prose-p:text-left prose-p:text-center prose-p:font-normal sm:prose-base lg:prose-lg mt-3">
										<p>{workshop.fields?.description}</p>
									</div>
								)}
								<Links className="mt-5" />
							</header>
							<article className="prose sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none pt-5">
								{body ? body : <p>No description found.</p>}
							</article>
						</div>

						<div className="relative col-span-3 flex h-full flex-col pt-2">
							<Suspense fallback={null}>
								<EditWorkshopButton
									className="absolute right-2 top-4 z-10"
									moduleType="workshop"
									moduleSlug={params.module}
									product={product}
								/>
							</Suspense>
							{workshop.fields?.coverImage?.url && (
								<div className="mb-3">
									<WorkshopImage
										imageUrl={workshop.fields.coverImage.url}
										abilityLoader={abilityLoader}
									/>
								</div>
							)}
							<WorkshopSidebar
								productType={product?.type}
								className="bg-transparent ring-0"
							>
								<h2 className="font-heading mb-2 flex h-12 items-center text-2xl font-semibold tracking-tight">
									Contents
								</h2>
								<div className="bg-card flex flex-col overflow-hidden rounded-lg border shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]">
									{isMultiWorkshopProduct &&
									allWorkshopsInProduct.length > 1 ? (
										<MultiWorkshopContent />
									) : (
										<WorkshopResourceList
											isCollapsible={false}
											className="border-r-0! w-full max-w-none"
											withHeader={false}
											maxHeight="h-auto"
											wrapperClassName="overflow-hidden pb-0"
										/>
									)}
								</div>
							</WorkshopSidebar>
						</div>
					</div>
				)}
				{/* {workshop?.fields?.body && <Links className="mb-20 mt-10" />} */}
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
