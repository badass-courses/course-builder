import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'
import { getCachedPage } from '@/lib/pages-query'
import { compileMDX } from '@/utils/compile-mdx'
import { MailPlus } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import CopyToClipboard from './components/copy-to-clipboard'

const PAGE_SLUG = 'boss-letter'

export async function generateMetadata(
	props: {},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const page = await getCachedPage(PAGE_SLUG)

	if (!page) {
		return parent as Metadata
	}

	return {
		title: page.fields.title,
		description: page.fields.description,
		openGraph: {
			title: page.fields.title,
			description: page.fields.description,
			images: [
				{
					url: `${env.NEXT_PUBLIC_URL}/api/og/default?title=${encodeURIComponent('Invest in your team')}`,
				},
			],
		},
	}
}

export default async function BossPage() {
	const page = await getCachedPage(PAGE_SLUG)

	if (!page || !page.fields?.body) {
		return notFound()
	}

	const { content } = await compileMDX(page.fields.body || '')

	return (
		<LayoutClient withContainer>
			<main className="py-10 sm:py-16">
				<div className="mb-10 flex flex-col items-center justify-center gap-2">
					<h1 className="font-heading w-full text-center text-3xl font-bold lg:text-4xl">
						{page.fields.title}
					</h1>
					<h2 className="font-heading text-primary w-full text-center text-lg font-medium lg:text-xl">
						Copy and Paste this letter and send it to your boss.
					</h2>
				</div>
				<div className="bg-card mx-auto mb-2 flex w-full max-w-3xl flex-col items-center rounded-lg shadow ring ring-gray-300/10 md:flex-row">
					<Link
						className="group relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden md:w-auto"
						target="_blank"
						rel="noopener noreferrer"
						download
						href="https://res.cloudinary.com/epic-web/image/upload/v1765394033/master-mcp.pdf"
					>
						<CldImage
							src="https://res.cloudinary.com/epic-web/image/upload/v1765394033/master-mcp.pdf"
							width={244}
							height={189}
							alt="MCP for Teams: Executive Overview"
							className="transition-transform group-hover:scale-105"
						/>
						<div className="bg-card text-primary ring-primary absolute bottom-3 rounded-md px-2 py-1 text-sm font-semibold ring md:left-3">
							PDF to attach to your email
						</div>
					</Link>
					<div className="flex flex-col gap-2 border-t p-5 md:border-l md:border-t-0 md:p-8 md:pl-5">
						<h3 className="text-xl font-bold">
							MCP for Teams: Executive Overview
						</h3>
						<p>
							A one-page PDF that explains the business case for MCP
							training—why it matters, what your team will learn, and the ROI
							for your company.
						</p>
						<Button asChild className="mt-1.5">
							<Link
								target="_blank"
								rel="noopener noreferrer"
								download
								href="https://res.cloudinary.com/epic-web/image/upload/v1765394033/master-mcp.pdf"
							>
								Download the 1-Pager and share it with your boss
							</Link>
						</Button>
					</div>
				</div>
				<article className="lg:prose-lg prose bg-card relative mx-auto w-full max-w-3xl overflow-hidden rounded-lg p-5 shadow ring ring-gray-300/10 sm:p-8">
					<CopyToClipboard content={page.fields.body} />
					<MailPlus
						className="text-foreground absolute -left-16 -top-16 size-80 rotate-6 opacity-5"
						aria-hidden
					/>
					{content}
				</article>
			</main>
		</LayoutClient>
	)
}
