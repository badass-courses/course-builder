import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	SubscribeForm,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getServerAuthSession } from '@/server/auth'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import MuxPlayer from '@mux/mux-player-react'
import { FileText } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Button } from '@coursebuilder/ui'

import {
	CenteredTitle,
	CheckList,
	Instructor,
	Section,
	Spacer,
} from './admin/pages/_components/page-builder-mdx-components'
import { CreatePostModal } from './admin/posts/_components/create-post-modal'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const searchParams = await props.searchParams

	let ogImageUrl =
		'https://res.cloudinary.com/epic-web/image/upload/v1744667710/ogImages/card-workshops_2x.png'
	const codeParam = searchParams?.code
	const couponParam = searchParams?.coupon
	const couponCodeOrId = codeParam || couponParam
	if (couponCodeOrId) {
		const coupon = await getCouponForCode(
			couponCodeOrId,
			[],
			courseBuilderAdapter,
		)
	}

	return {
		title: {
			template: '%s | Epic Web',
			default: `Epic Web`,
		},
		openGraph: {
			images: [
				{
					url: ogImageUrl,
				},
			],
		},
	}
}

type Props = {
	searchParams: Promise<{ [key: string]: string | undefined }>
}

const Home = async (props: Props) => {
	const { session } = await getServerAuthSession()
	const role = session?.user.role ?? 'guest'
	const page = await getPage('root')
	const isCommerceEnabled = await commerceEnabled()

	const firstPageResource = page?.resources?.[0] && {
		path: page.resources[0]?.resource?.fields?.slug,
		title: page.resources[0]?.resource?.fields?.title,
	}

	let actionSection: React.ReactNode = null

	if (!session?.user) {
		actionSection = (
			<section className="mt-6 flex w-full flex-col items-center gap-6 py-6">
				<div className="flex flex-wrap justify-center gap-4">
					<Button asChild size="lg">
						<Link href="/login" prefetch>
							Sign&nbsp;in
						</Link>
					</Button>
					<Button asChild variant="secondary" size="lg">
						<Link href="/login" prefetch>
							Create&nbsp;account
						</Link>
					</Button>
				</div>
				<p className="text-muted-foreground max-w-2xl text-center">
					Epic Web Course Builder is the platform we use to draft, edit, and
					publish tips and articles for the Epic Web community. Sign in or
					create an account to start contributing.
				</p>
			</section>
		)
	} else if (role === 'contributor') {
		actionSection = (
			<section className="mt-6 flex w-full flex-col items-center gap-5 py-6">
				<div className="flex flex-wrap justify-center gap-4">
					<CreatePostModal
						triggerLabel="New Tip"
						title="New Tip"
						availableResourceTypes={['tip']}
						defaultResourceType="tip"
						topLevelResourceTypes={['post']}
					/>
					<CreatePostModal
						triggerLabel="New Article"
						title="New Article"
						availableResourceTypes={['article']}
						defaultResourceType="article"
						topLevelResourceTypes={['post']}
					/>
				</div>
				<p className="text-muted-foreground max-w-2xl text-center">
					Quickly create a new tip or article to share with the community.
				</p>
			</section>
		)
	} else if (role === 'admin') {
		const adminLinks = [
			{ href: '/admin/pages', label: 'Admin Pages' },
			{ href: '/admin/posts', label: 'Admin Posts' },
			{ href: '/admin/tips', label: 'Admin Tips' },
		]

		actionSection = (
			<section className="mt-6 flex w-full flex-col items-center gap-6 py-6">
				<div className="flex flex-wrap justify-center gap-4">
					<CreatePostModal
						triggerLabel="New Tip"
						title="New Tip"
						availableResourceTypes={['tip']}
						defaultResourceType="tip"
						topLevelResourceTypes={['post']}
					/>
					<CreatePostModal
						triggerLabel="New Article"
						title="New Article"
						availableResourceTypes={['article']}
						defaultResourceType="article"
						topLevelResourceTypes={['post']}
					/>
				</div>
				<nav className="flex flex-wrap justify-center gap-3">
					{adminLinks.map(({ href, label }) => (
						<Button
							key={href}
							asChild
							variant="outline"
							size="sm"
							className="flex items-center gap-1"
						>
							<Link href={href} prefetch>
								<FileText className="h-4 w-4" /> {label}
							</Link>
						</Button>
					))}
				</nav>
			</section>
		)
	}

	return (
		<LayoutClient
			className="static"
			highlightedResource={firstPageResource}
			withContainer
		>
			<main className="flex w-full flex-col items-center justify-center">
				{firstPageResource && (
					<Link
						className="text-primary mx-auto flex items-center justify-center gap-1 rounded-md  px-3 py-1 text-sm font-medium "
						href={firstPageResource.path}
						prefetch
					>
						New: <span className="underline">{firstPageResource?.title}</span>
					</Link>
				)}
				<header>
					<h1 className="sm:fluid-3xl fluid-2xl mb-6 w-full pt-10 text-center font-bold dark:text-white">
						Epic Web Builder
					</h1>
				</header>
				{actionSection && <div className="w-full">{actionSection}</div>}

				<article
					className={cn(
						'prose dark:prose-invert lg:prose-xl sm:prose-lg mx-auo w-full max-w-3xl pb-10',
					)}
				>
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								CenteredTitle,
								Instructor,
								Spacer,
								Section,
								CheckList,
								Testimonial,
								CldImage: (props) => <CldImage {...props} />,
								SubscribeForm,
								ThemeImage: (props) => <ThemeImage {...props} />,
								PrimaryNewsletterCta: (props) => (
									<PrimaryNewsletterCta
										resource={firstPageResource}
										className={cn('not-prose pb-10 sm:pb-16', props.className)}
										trackProps={{
											event: 'subscribed',
											params: {
												location: 'home',
											},
										}}
										{...props}
									/>
								),
								// @ts-expect-error
								MuxPlayer,
							}}
						/>
					) : (
						<p>
							Epic Web Course Builder helps create and manage educational
							content. Get started by creating an account or selecting one of
							the actions above.
						</p>
					)}
				</article>
			</main>
		</LayoutClient>
	)
}

export default Home
