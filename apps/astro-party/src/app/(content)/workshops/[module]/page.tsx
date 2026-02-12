import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { EditWorkshopButton } from '@/app/(content)/workshops/_components/edit-workshop-button'
import { NextLessonButton } from '@/app/(content)/workshops/_components/next-lesson-button'
import { PreviewWorkshopButton } from '@/app/(content)/workshops/_components/preview-workshop-button'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'
import config from '@/config'
import { env } from '@/env.mjs'
import { getMinimalWorkshop, getWorkshop } from '@/lib/workshops-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { Construction } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import ReactMarkdown from 'react-markdown'
import { Course } from 'schema-dts'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { WorkshopPricing as WorkshopPricingClient } from '../_components/workshop-pricing'
import { WorkshopPricing } from '../_components/workshop-pricing-server'

type Props = {
	params: Promise<{ module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const workshop = await getWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields.title,
		description: workshop.fields.description,
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
	const workshop = await getMinimalWorkshop(params.module)

	if (!workshop) {
		notFound()
	}

	return (
		<>
			{workshop.fields?.visibility !== 'public' && (
				<div className="bg-muted flex w-full items-center justify-center gap-2 p-3 text-center">
					<Construction className="h-4 w-4" />{' '}
					<p className="text-sm font-medium capitalize">
						{workshop.fields?.visibility} {workshop.type}
					</p>
				</div>
			)}
			<main className="container relative px-0">
				<WorkshopMetadata
					title={workshop.fields?.title}
					description={workshop.fields?.description || ''}
					imageUrl={workshop.fields?.coverImage?.url}
					slug={params.module}
				/>
				<WorkshopPricing searchParams={searchParams} moduleSlug={params.module}>
					{(pricingProps) => {
						return (
							<>
								<EditWorkshopButton
									moduleType="workshop"
									moduleSlug={params.module}
								/>
								<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 sm:px-10 md:flex-row">
									<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
										<p className="text-primary mb-2 text-base">Pro Workshop</p>
										<h1 className="font-heading fluid-4xl font-bold">
											{workshop.fields?.title}
										</h1>
										{workshop.fields?.description && (
											<h2 className="fluid-lg text-muted-foreground mt-5">
												{workshop.fields?.description}
											</h2>
										)}
										<Contributor className="mt-5" />
										{pricingProps.hasPurchasedCurrentProduct ? (
											<NextLessonButton
												moduleType="workshop"
												moduleSlug={params.module}
											/>
										) : (
											<PreviewWorkshopButton moduleSlug={params.module} />
										)}
									</div>
									{workshop.fields?.coverImage?.url && (
										<CldImage
											width={400}
											height={400}
											src={workshop.fields.coverImage.url}
											alt={workshop.fields.coverImage?.alt || ''}
										/>
									)}
								</div>
								<div className="flex flex-col px-5 pb-10 sm:px-10 md:flex-row md:gap-10">
									<article className="prose sm:prose prose-sm w-full max-w-none py-8">
										{workshop.fields?.body ? (
											<MDXRemote source={workshop.fields.body} options={{ blockJS: false }} />
										) : (
											<p>No description found.</p>
										)}
									</article>
									<div className="flex w-full flex-col gap-3 sm:max-w-sm">
										{pricingProps.hasPurchasedCurrentProduct ? null : (
											<WorkshopPricingClient {...pricingProps} />
										)}

										<strong className="font-mono text-sm font-bold uppercase tracking-wide text-gray-700">
											Contents
										</strong>
										<WorkshopResourceList
											className="w-full max-w-none border-r-0"
											withHeader={false}
											maxHeight="h-auto"
											wrapperClassName="border bg-card overflow-hidden rounded pb-0"
										/>
									</div>
								</div>
							</>
						)
					}}
				</WorkshopPricing>
			</main>
		</>
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
