'use client'

import {
	CopyToClipboard,
	Facebook,
	LinkedIn,
	Reddit,
	Twitter,
} from '@/components/share-links'
import { env } from '@/env.mjs'
import { HeartIcon } from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@coursebuilder/ui/utils/cn'

const Share: React.FC<{
	title: string
	contentType?: string
	contributor?: any
	className?: string
	path?: string
}> = ({ title, contentType = 'article', contributor, className, path }) => {
	const url = env.NEXT_PUBLIC_URL + path
	const shareButtonClassName =
		'w-full flex items-center justify-center h-full px-7 py-7 hover:bg-foreground/5 transition'
	const contributorTwitterHandle = contributor?.twitterHandle

	return (
		<section
			className={cn(
				'mx-auto flex w-full max-w-screen-md items-center justify-center overflow-hidden border border-gray-200 bg-transparent pt-5 sm:pl-5 sm:pt-0 md:rounded dark:border-transparent dark:bg-gray-900 dark:sm:border-0',
				className,
			)}
		>
			<div className="mx-auto flex w-full max-w-screen-md flex-col items-center justify-between gap-5 sm:flex-row">
				<div>
					<p className="flex items-center text-lg font-medium">
						<HeartIcon
							aria-hidden="true"
							className="animate-heartbeat mr-4 inline-block h-5 w-5 flex-shrink-0 text-rose-400/90"
						/>
						<span className="leading-tight">
							Share this {contentType} with your friends
						</span>
					</p>
				</div>
				<div className="dark:divide-background dark:border-background flex w-full items-center justify-center divide-x divide-gray-200 border-t border-gray-200 pt-0 sm:w-auto sm:border-t-0 dark:sm:border-t-0">
					<Twitter
						className={shareButtonClassName}
						svgClassName="w-4 h-4"
						link={url}
						message={`${title}, ${contentType ? contentType : ''}${
							contributorTwitterHandle ? ` by @${contributorTwitterHandle}` : ''
						}`}
					/>
					<Facebook
						className={shareButtonClassName}
						svgClassName="w-4 h-4"
						link={url}
					/>
					<LinkedIn
						className={shareButtonClassName}
						svgClassName="w-4 h-4"
						link={url}
					/>
					<Reddit
						className={shareButtonClassName}
						svgClassName="w-4 h-4"
						link={url}
					/>
					<CopyToClipboard
						className={shareButtonClassName}
						onSuccess={() => {
							toast.success('Copied to clipboard')
						}}
						svgClassName="w-4 h-4"
						link={url}
					/>
				</div>
			</div>
		</section>
	)
}

export default Share
