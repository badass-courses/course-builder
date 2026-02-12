import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	SubscribeForm,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import LayoutWithImpersonation from '@/components/layout-with-impersonation'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getImpersonatedSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { userHasRole } from '@/utils/user-has-role'
import MuxPlayer from '@mux/mux-player-react'
import { FileText, Users } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Button } from '@coursebuilder/ui'

import { CreateResourceModals } from './_components/create-resource-modals'
import {
	CenteredTitle,
	CheckList,
	Instructor,
	Section,
	Spacer,
} from './admin/pages/_components/page-builder-mdx-components'

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
	const { session } = await getImpersonatedSession()

	const page = await getPage('root')
	const isCommerceEnabled = await commerceEnabled()

	const firstPageResource = undefined

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
	} else if (userHasRole(session.user, 'admin')) {
		const contentManagementLinks = [
			{
				href: '/admin/posts',
				label: 'All Posts',
				description: 'View and edit all posts',
			},
			{
				href: '/admin/tips',
				label: 'All Tips',
				description: 'View and edit all tips',
			},
			{
				href: '/admin/pages',
				label: 'All Pages',
				description: 'Manage site pages',
			},
			{
				href: '/admin/workshops',
				label: 'All Workshops',
				description: 'View and edit all workshops',
			},
			{
				href: '/admin/products',
				label: 'All Products',
				description: 'View and edit all products',
			},
		]

		const userManagementLinks = [
			{
				href: '/admin/contributors',
				label: 'Contributors',
				description: 'Manage users and impersonate',
			},
		]

		actionSection = (
			<section className="mt-6 flex w-full flex-col items-center py-6">
				<div className="w-full max-w-5xl space-y-6">
					{/* Content Oversight - Primary admin function */}
					<div className="bg-card rounded-lg border p-6 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold">Content Oversight</h2>
						<p className="text-muted-foreground mb-4 text-sm">
							View and manage all content across the platform
						</p>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{contentManagementLinks.map(({ href, label, description }) => (
								<Button
									key={href}
									asChild
									variant="outline"
									size="default"
									className="flex h-auto flex-col items-start gap-2 p-4 text-left"
								>
									<Link href={href} prefetch>
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											<span className="font-medium">{label}</span>
										</div>
										<span className="text-muted-foreground text-xs">
											{description}
										</span>
									</Link>
								</Button>
							))}
						</div>
					</div>

					{/* User Management */}
					<div className="bg-card rounded-lg border p-6 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold">User Management</h2>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex-1">
								<p className="text-muted-foreground text-sm">
									Manage contributors and impersonate users for support
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								{userManagementLinks.map(({ href, label, description }) => (
									<Button
										key={href}
										asChild
										variant="default"
										size="default"
										className="flex items-center gap-2"
									>
										<Link href={href} prefetch>
											<Users className="h-4 w-4" /> {label}
										</Link>
									</Button>
								))}
							</div>
						</div>
					</div>

					{/* Personal Content Creation */}
					<div className="bg-card rounded-lg border p-6 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold">
							Personal Content Creation
						</h2>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex-1">
								<p className="text-muted-foreground text-sm">
									Access your personal dashboard and create your own content
								</p>
							</div>
							<Button asChild size="lg" variant="secondary" className="sm:ml-4">
								<Link href="/dashboard">Your Dashboard</Link>
							</Button>
						</div>
						<div className="mt-4 border-t pt-4">
							<p className="text-muted-foreground mb-3 text-sm">
								Create new content:
							</p>
							<div className="flex flex-wrap gap-3">
								<CreateResourceModals
									isAdmin={userHasRole(session.user, 'admin')}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
		)
	} else if (userHasRole(session.user, 'contributor')) {
		actionSection = (
			<section className="mt-6 flex w-full flex-col items-center gap-5 py-6">
				<div className="flex w-full max-w-md flex-col gap-4">
					<Button asChild size="lg">
						<Link href="/dashboard">Go to Your Dashboard</Link>
					</Button>
					<div className="grid grid-cols-2 gap-4">
						<CreateResourceModals />
					</div>
				</div>
				<p className="text-muted-foreground max-w-2xl text-center">
					Create a new tip or article to share with the community.
				</p>
			</section>
		)
	}

	return (
		<LayoutWithImpersonation
			className="static"
			highlightedResource={firstPageResource}
			withContainer
		>
			<main className="flex w-full flex-col items-center justify-center">
				<header>
					<h1 className="sm:fluid-3xl fluid-2xl mb-6 w-full pt-10 text-center font-bold dark:text-white">
						Epic Web Builder
					</h1>
				</header>
				{actionSection && <div className="w-full">{actionSection}</div>}

				<article
					className={cn(
						'prose dark:prose-invert lg:prose-xl sm:prose-lg mx-auto w-full max-w-3xl pb-10',
					)}
				>
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							options={{ blockJS: false }}
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
								MuxPlayer: (props) => <MuxPlayer {...props} />,
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
		</LayoutWithImpersonation>
	)
}

export default Home
