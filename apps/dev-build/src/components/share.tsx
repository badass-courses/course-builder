'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import config from '@/config'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'

import { Button, useToast } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const Share = ({
	className,
	title,
}: {
	className?: string
	title?: string
}) => {
	const pathname = usePathname()
	const url = env.NEXT_PUBLIC_URL + pathname
	const { toast } = useToast()

	const handleShare = async (
		platform: 'bluesky' | 'x' | 'linkedin' | 'copy',
	) => {
		await track('share_content', {
			platform,
			url,
			title,
			pathname,
		})
	}

	return (
		<div
			className={cn(
				'divide-border flex items-center justify-center gap-0 divide-x rounded-none',
				className,
			)}
		>
			<Button
				asChild
				variant="outline"
				size="icon"
				className="size-16 rounded-none border-y-0 border-l border-r bg-transparent shadow-none dark:bg-transparent"
			>
				<a
					href={`https://x.com/intent/tweet?text=${encodeURIComponent(url + `${title ? `${title} ` : ''} by ${config.twitter.handle}`)}`}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => handleShare('x')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-5"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M2.357 2.781a.975.975 0 0 1 .868-.531H8.1c.313 0 .607.15.79.404l12.675 17.55a.975.975 0 0 1-.79 1.546H15.9a.975.975 0 0 1-.79-.404L2.435 3.796a.975.975 0 0 1-.078-1.015Z"
							opacity=".4"
						/>
						<path
							fill="currentColor"
							d="m2.536 20.086 17.55-17.55a.975.975 0 1 1 1.378 1.378l-17.55 17.55a.975.975 0 1 1-1.378-1.378Z"
						/>
					</svg>
				</a>
			</Button>
			<Button
				asChild
				variant="outline"
				size="icon"
				className="size-16 rounded-none border-y-0 border-l-0 border-r bg-transparent shadow-none dark:bg-transparent"
			>
				<a
					href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`${title ? `${title} ` : ''} by ${config.bluesky.handle}

        ${url}`)}`}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => handleShare('bluesky')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-5"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M12 11.496C11.894 11.296 7.455 3 3.504 3c-2.168 0-1.5 5-1 7.5.203 1.01 1 4 5.499 3.5 0 0-3.999.5-3.999 3 0 1.5 2.5 4 4.499 4 1.958 0 3.436-4.314 3.497-4.494.06.18 1.54 4.494 3.497 4.494 2 0 4.499-2.5 4.499-4 0-2.5-3.999-3-3.999-3 4.499.5 5.297-2.49 5.499-3.5.5-2.5 1.168-7.5-1-7.5-3.95 0-8.39 8.296-8.496 8.496Z"
							opacity=".4"
						/>
					</svg>
				</a>
			</Button>

			<Button
				asChild
				variant="outline"
				size="icon"
				className="size-16 rounded-none border-y-0 border-l-0 border-r bg-transparent shadow-none dark:bg-transparent"
			>
				<a
					href={`https://linkedin.com/shareArticle?mini=true&url=${url}?author=${config.author}`}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => handleShare('linkedin')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-5"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M5 9h-.5c-.943 0-1.414 0-1.707.293C2.5 9.586 2.5 10.057 2.5 11v8.5c0 .943 0 1.414.293 1.707.293.293.764.293 1.707.293H5c.943 0 1.414 0 1.707-.293C7 20.914 7 20.443 7 19.5V11c0-.943 0-1.414-.293-1.707C6.414 9 5.943 9 5 9Zm2-4.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
						/>
						<path
							fill="currentColor"
							d="M11.826 9H11c-.943 0-1.414 0-1.707.293C9 9.586 9 10.057 9 11v8.5c0 .943 0 1.414.293 1.707.293.293.764.293 1.707.293h.5c.943 0 1.414 0 1.707-.293.293-.293.293-.764.293-1.707V16c0-1.657.528-3 2.088-3 .78 0 1.412.672 1.412 1.5V19c0 .943 0 1.414.293 1.707.293.293.764.293 1.707.293h.499c.942 0 1.414 0 1.707-.293.292-.293.293-.764.293-1.706l.001-5.5c0-2.486-2.364-4.5-4.703-4.5-1.332 0-2.52.652-3.297 1.673 0-.63 0-.945-.137-1.179a1 1 0 0 0-.358-.358C12.771 9 12.456 9 11.826 9Z"
							opacity=".4"
						/>
					</svg>
				</a>
			</Button>
			<Button
				className="h-16 text-nowrap rounded-none border-y-0 border-l-0 border-r bg-transparent shadow-none dark:bg-transparent"
				variant="outline"
				onClick={async () => {
					await navigator.clipboard.writeText(url)
					await handleShare('copy')
					toast({
						title: 'URL Copied',
					})
				}}
			>
				Copy URL
			</Button>
		</div>
	)
}
