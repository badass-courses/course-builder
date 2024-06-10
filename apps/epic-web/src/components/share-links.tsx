'use client'

import * as React from 'react'
import useClipboard from 'react-use-clipboard'

import {
	FacebookIcon,
	HackerNewsIcon,
	LinkedInIcon,
	LinkIcon,
	RedditIcon,
	TwitterIcon,
} from './share-icons'

type ShareLinkProps = {
	link: string
	message?: string
	className?: string
	svgClassName?: string
}

const defaultStyle =
	'rounded-lg bg-gray-400 bg-opacity-10 hover:bg-opacity-20 transition-all ease-in-out duration-200 flex items-center justify-center p-3 m-1'

const Twitter: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
	link,
	message,
	className = defaultStyle,
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => (
	<a
		href={getShareUrl('twitter', link, message)}
		className={className}
		target="_blank"
		rel="noopener noreferrer"
		{...props}
	>
		<TwitterIcon className={svgClassName} />
		{children || <span className="sr-only">share on twitter</span>}
	</a>
)

const Facebook: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
	link,
	className = defaultStyle,
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => (
	<a
		href={getShareUrl('facebook', link)}
		className={className}
		target="_blank"
		rel="noopener noreferrer"
		{...props}
	>
		<FacebookIcon className={svgClassName} />
		{children || <span className="sr-only">share on facebook</span>}
	</a>
)

const Reddit: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
	link,
	message,
	className = defaultStyle,
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => (
	<a
		href={getShareUrl('reddit', link)}
		className={className}
		target="_blank"
		rel="noopener noreferrer"
		{...props}
	>
		<RedditIcon className={svgClassName} />
		{children || <span className="sr-only">share on reddit</span>}
	</a>
)

const CopyToClipboard: React.FC<
	React.PropsWithChildren<ShareLinkProps & { onSuccess: () => void }>
> = ({
	link,
	onSuccess,
	className = defaultStyle + ' relative text-xs',
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => {
	const [_, copyToClipboard] = useClipboard(link, {
		successDuration: 700,
	})

	return (
		<button
			type="button"
			onClick={() => {
				copyToClipboard()
				onSuccess()
			}}
			className={className}
			{...props}
		>
			<LinkIcon className={svgClassName} />
			{children || <span className="sr-only">copy url to clipboard</span>}
		</button>
	)
}

const LinkedIn: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
	link,
	className = defaultStyle,
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => (
	<a
		href={getShareUrl('linkedin', link)}
		className={className}
		target="_blank"
		rel="noopener noreferrer"
		{...props}
	>
		<LinkedInIcon className={svgClassName} />
		{children || <span className="sr-only">share on linkedin</span>}
	</a>
)

const Hacker: React.FC<React.PropsWithChildren<ShareLinkProps>> = ({
	link,
	message,
	className = defaultStyle,
	svgClassName = 'w-4 h-4',
	children,
	...props
}) => (
	<a
		href={getShareUrl('hacker', link)}
		className={className}
		target="_blank"
		rel="noopener noreferrer"
		{...props}
	>
		<HackerNewsIcon className={svgClassName} />
		{children || <span className="sr-only">share on hacker news</span>}
	</a>
)

type platforms = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'hacker'

export const shareLinks = {
	twitter: (link = '', message = '') =>
		`https://twitter.com/intent/tweet/?text=${encodeURIComponent(
			message,
		)}&url=${encodeURIComponent(link)}`,
	facebook: (link = '') =>
		`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
	reddit: (link = '', message = '') =>
		`https://reddit.com/submit/?url=${encodeURIComponent(
			link,
		)}&title=${encodeURIComponent(message)}`,
	linkedin: (link = '') =>
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
			link,
		)}`,
	hacker: (link = '', message = '') =>
		`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
			link,
		)}&t=${encodeURIComponent(message)}`,
}

const getShareUrl = (type: platforms, link: string, message?: string) => {
	switch (type) {
		case 'twitter':
			return shareLinks.twitter(
				link,
				message ? message : `@${process.env.NEXT_PUBLIC_PARTNER_TWITTER}`,
			)
		case 'facebook':
			return shareLinks.facebook(link)
		case 'reddit':
			return shareLinks.reddit(link, message)
		case 'linkedin':
			return shareLinks.linkedin(link)
		case 'linkedin':
			return shareLinks.linkedin(link)
	}
}

export { Twitter, Facebook, Reddit, CopyToClipboard, LinkedIn, Hacker }
