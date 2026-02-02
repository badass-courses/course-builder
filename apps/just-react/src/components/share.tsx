'use client'

import React, { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import config from '@/config'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { CheckIcon, LinkIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const Icons = {
	bluesky: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="size-5"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke="currentColor"
				strokeWidth="1.5"
				d="M12 11.496C11.894 11.296 7.455 3 3.504 3c-2.168 0-1.5 5-1 7.5.203 1.01 1 4 5.499 3.5 0 0-3.999.5-3.999 3 0 1.5 2.5 4 4.499 4 1.958 0 3.436-4.314 3.497-4.494.06.18 1.54 4.494 3.497 4.494 2 0 4.499-2.5 4.499-4 0-2.5-3.999-3-3.999-3 4.499.5 5.297-2.49 5.499-3.5.5-2.5 1.168-7.5-1-7.5-3.95 0-8.39 8.296-8.496 8.496Z"
			/>
		</svg>
	),
	x: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="size-5"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="m3 21 7.548-7.548M21 3l-7.548 7.548m0 0L8 3H3l7.548 10.452m2.904-2.904L21 21h-5l-5.452-7.548"
			/>
		</svg>
	),
	linkedin: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="size-5"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="M7 10v7m4-4v4m0-4a3 3 0 1 1 6 0v4m-6-4v-3"
			/>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="M7.008 7h-.009"
			/>
			<path
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109C18.717 21.5 16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391C2.5 18.717 2.5 16.479 2.5 12Z"
			/>
		</svg>
	),
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

type Platform = 'bluesky' | 'x' | 'linkedin' | 'copy'

interface ShareContextValue {
	url: string
	title?: string
	handleShare: (platform: Platform) => Promise<void>
}

const ShareContext = createContext<ShareContextValue | null>(null)

const useShareContext = () => {
	const ctx = useContext(ShareContext)
	if (!ctx) throw new Error('Share components must be used within Share.Root')
	return ctx
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

const buttonBase = ''

interface RootProps {
	className?: string
	title?: string
	children: React.ReactNode
}

function Root({ className, title, children }: RootProps) {
	const pathname = usePathname()
	const url = env.NEXT_PUBLIC_URL + pathname

	const handleShare = async (platform: Platform) => {
		await track('share_content', { platform, url, title, pathname })
	}

	return (
		<ShareContext.Provider value={{ url, title, handleShare }}>
			<div className={cn('', className)}>{children}</div>
		</ShareContext.Provider>
	)
}

function Bluesky({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) {
	const { url, title, handleShare } = useShareContext()
	const text = `${title ? `${title} ` : ''}by ${config.bluesky.handle}\n\n${url}`

	return (
		<Button
			asChild
			variant="ghost"
			size={children ? 'default' : 'icon'}
			className={cn(buttonBase, '', className)}
		>
			<a
				href={`https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`}
				target="_blank"
				rel="noopener noreferrer"
				onClick={() => handleShare('bluesky')}
			>
				{Icons.bluesky}
				<span>{children}</span>
			</a>
		</Button>
	)
}

function X({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) {
	const { url, title, handleShare } = useShareContext()
	const text = `${url} ${title ? `${title} ` : ''}by ${config.twitter.handle}`

	return (
		<Button
			asChild
			variant="ghost"
			size={children ? 'default' : 'icon'}
			className={cn(buttonBase, '', className)}
		>
			<a
				href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`}
				target="_blank"
				rel="noopener noreferrer"
				onClick={() => handleShare('x')}
			>
				{Icons.x}
				<span>{children}</span>
			</a>
		</Button>
	)
}

function LinkedIn({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) {
	const { url, handleShare } = useShareContext()

	return (
		<Button
			asChild
			variant="ghost"
			size={children ? 'default' : 'icon'}
			className={cn(buttonBase, '', className)}
		>
			<a
				href={`https://linkedin.com/shareArticle?mini=true&url=${url}?author=${config.author}`}
				target="_blank"
				rel="noopener noreferrer"
				onClick={() => handleShare('linkedin')}
			>
				{Icons.linkedin}
				<span>{children}</span>
			</a>
		</Button>
	)
}

function CopyUrl({
	className,
	label = 'Copy link',
	copiedLabel = 'Copied!',
	children,
}: {
	className?: string
	label?: string
	copiedLabel?: string
	children?: React.ReactNode
}) {
	const { url, handleShare } = useShareContext()
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url)
			await handleShare('copy')
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	return (
		<Button
			variant="ghost"
			className={cn(
				'hover:text-primary inline-flex min-w-[11.5ch] items-center gap-2 px-3 text-sm font-medium transition',
				className,
			)}
			onClick={handleCopy}
		>
			<div className="flex shrink-0 items-center justify-center">
				{copied ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-5"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke="currentColor"
							strokeWidth="1.5"
							d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109C18.717 21.5 16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391C2.5 18.717 2.5 16.479 2.5 12Z"
						/>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="m8 12.5 2.5 2.5L16 9"
						/>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-5"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M14.556 13.218a2.67 2.67 0 0 1-3.774-3.774l2.359-2.36a2.67 2.67 0 0 1 3.628-.135m-.325-3.167a2.669 2.669 0 1 1 3.774 3.774l-2.359 2.36a2.67 2.67 0 0 1-3.628.135"
						/>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M10.5 3c-3.287 0-4.931 0-6.037.908a4 4 0 0 0-.555.554C3 5.57 3 7.212 3 10.5V13c0 3.771 0 5.657 1.172 6.828C5.343 21 7.229 21 11 21h2.5c3.287 0 4.931 0 6.038-.908.202-.166.388-.352.554-.554C21 18.43 21 16.788 21 13.5"
						/>
					</svg>
				)}
			</div>
			<span>{copied ? copiedLabel : label}</span>
		</Button>
	)
}

// ─────────────────────────────────────────────────────────────
// Exports (use: import * as Share from '@/components/share')
// ─────────────────────────────────────────────────────────────

export { Root, Bluesky, X, LinkedIn, CopyUrl }

// Default composed version for drop-in replacement
export function ShareBar({
	className,
	title,
}: {
	className?: string
	title?: string
}) {
	return (
		<Root className={className} title={title}>
			<Bluesky />
			<X />
			<LinkedIn />
			<CopyUrl />
		</Root>
	)
}
