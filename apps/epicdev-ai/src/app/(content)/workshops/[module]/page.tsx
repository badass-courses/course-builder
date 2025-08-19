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
					'relative w-full grid-cols-6 items-center overflow-hidden rounded-lg rounded-br-none border md:grid',
					className,
				)}
			>
				<div className="divide-border col-span-4 flex flex-wrap items-center divide-y sm:divide-y-0">
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
										className="hover:bg-muted h-14 w-full rounded-none px-5 ease-out md:w-auto md:border-r"
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

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-screen w-full flex-col">
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
				<header className="relative flex items-center justify-center overflow-hidden">
					<div className="relative z-10 mx-auto flex h-full w-full flex-col-reverse items-center justify-between gap-5 pb-10 md:grid md:grid-cols-5 md:gap-10 md:pt-5 lg:gap-5">
						<div className="col-span-3 flex shrink-0 flex-col items-center px-5 md:items-start md:px-0">
							<WorkshopBreadcrumb />
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
				</header>

				<>
					<Links>
						<ContentTitle />
					</Links>
					<div className="mx-auto flex w-full grow grid-cols-6 flex-col md:grid">
						<article className="prose sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl col-span-4 max-w-none py-10 md:pr-10">
							{workshop.fields?.body ? (
								<ReactMarkdown>{workshop.fields.body}</ReactMarkdown>
							) : (
								<p>No description found.</p>
							)}
						</article>
						<div className="col-span-2 flex flex-col border-x">
							<WorkshopResourceList
								isCollapsible={false}
								className="border-r-0! w-full max-w-none"
								withHeader={false}
								maxHeight="h-auto"
								wrapperClassName="overflow-hidden pb-0"
							/>
						</div>
					</div>
					{workshop?.fields?.body && (
						<Links className="rounded-br-lg rounded-tr-none" />
					)}
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
