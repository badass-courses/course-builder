'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import config from '@/config'
import { env } from '@/env.mjs'

import { useToast } from '@coursebuilder/ui'
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

	return (
		<div
			className={cn(
				'[&_a]:hover:bg-foreground/5 [&_button]:hover:bg-foreground/5 relative flex items-stretch rounded border [&_a]:flex [&_a]:aspect-square [&_a]:w-full [&_a]:max-w-14 [&_a]:items-center [&_a]:justify-center [&_a]:border-r [&_a]:p-3 [&_a]:first-of-type:rounded-l [&_button]:flex [&_button]:items-center [&_button]:p-3 [&_button]:px-5',
				className,
			)}
		>
			<div
				className="via-foreground/10 bg-linear-to-r absolute -top-px left-0 h-px w-full from-transparent to-transparent"
				aria-hidden="true"
			/>
			<div
				className="via-foreground/10 bg-linear-to-r absolute -bottom-px left-0 h-px w-2/3 from-transparent to-transparent"
				aria-hidden="true"
			/>
			<a
				href={`https://x.com/intent/tweet?text=${encodeURIComponent(url + `${title ? `${title} ` : ''} by ${config.twitter.handle}`)}`}
				target="_blank"
				rel="noopener noreferrer"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9.52373 6.77569L15.4811 0H14.0699L8.89493 5.88203L4.7648 0H0L6.24693 8.89552L0 16H1.4112L6.87253 9.78704L11.2352 16H16M1.92053 1.04127H4.08853L14.0688 15.0099H11.9003"
						fill="currentColor"
					/>
				</svg>
			</a>
			<a
				href={`https://linkedin.com/shareArticle?mini=true&url=${url}?author=${config.author}`}
				target="_blank"
				rel="noopener noreferrer"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1 2.99134C1 2.41413 1.20271 1.93794 1.60811 1.56277C2.01351 1.18758 2.54055 1 3.18919 1C3.82626 1 4.34169 1.18469 4.73552 1.55411C5.14092 1.93506 5.34363 2.43145 5.34363 3.04329C5.34363 3.5974 5.14672 4.05915 4.7529 4.42857C4.3475 4.80952 3.81467 5 3.15444 5H3.13707C2.49999 5 1.98456 4.80952 1.59073 4.42857C1.19691 4.04762 1 3.56854 1 2.99134ZM1.22587 18.1429V6.57576H5.08301V18.1429H1.22587ZM7.22008 18.1429H11.0772V11.684C11.0772 11.2799 11.1236 10.9682 11.2162 10.7489C11.3784 10.3564 11.6245 10.0245 11.9546 9.75324C12.2847 9.48195 12.6988 9.34632 13.1969 9.34632C14.4942 9.34632 15.1429 10.2179 15.1429 11.961V18.1429H19V11.5108C19 9.8023 18.5946 8.50649 17.7838 7.62337C16.973 6.74026 15.9015 6.2987 14.5695 6.2987C13.0753 6.2987 11.9112 6.93939 11.0772 8.22078V8.25541H11.0598L11.0772 8.22078V6.57576H7.22008C7.24324 6.94516 7.25483 8.09378 7.25483 10.0216C7.25483 11.9495 7.24324 14.6565 7.22008 18.1429Z"
						fill="currentColor"
					/>
				</svg>
			</a>
			<button
				type="button"
				onClick={() => {
					navigator.clipboard.writeText(url)
					toast({
						title: 'Copied URL',
					})
				}}
			>
				Copy URL
			</button>
		</div>
	)
}
