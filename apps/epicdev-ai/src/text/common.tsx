import Link from 'next/link'
import config from '@/config'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default {
	'newsletter-subscribed-logged-in': ({
		resource,
	}: {
		resource?: {
			path: string
			title: string
			type: string
		}
	}) => {
		const defaultResource = {
			path: '/the-game-changing-potential-of-model-context-protocol',
			title: 'The game-changing potential of Model Context Protocol',
			type: 'post',
		}
		return (
			<>
				Ready to learn? Check out{' '}
				<Link
					className="underline underline-offset-2"
					href={getResourcePath(
						resource?.type || 'post',
						resource?.path || defaultResource.path,
						'view',
					)}
				>
					{resource?.title || defaultResource.title}
				</Link>
				.
			</>
		)
	},
	'newsletter-subscribed-logged-out': ({
		resource,
	}: {
		resource?: {
			path: string
			title: string
		}
	}) => {
		const defaultResource = {
			path: '/the-game-changing-potential-of-model-context-protocol',
			title: 'The game-changing potential of Model Context Protocol',
		}
		return (
			<>
				Ready to learn?{' '}
				<Link href="/login" className="underline underline-offset-2">
					Log in
				</Link>{' '}
				to track your progress and check out{' '}
				<Link
					href={resource?.path || defaultResource.path}
					className="underline underline-offset-2"
				>
					{resource?.title || defaultResource.title}
				</Link>
				.
			</>
		)
	},

	'primary-newsletter-button-cta-label': 'Subscribe',
	'primary-newsletter-tittle':
		'Start designing the future of intelligent user experiences',
	'primary-newsletter-byline': `Join the EpicAI.pro newsletter to get updates on events, articles, and more as they’re released`,
	'tip-newsletter-button-cta-label': 'Subscribe',
	'tip-newsletter-tittle': 'Tip Newsletter Title',
	'video-newsletter-title': 'Build the next-gen UX with AI',
	'video-newsletter-subtitle': 'For builders of the AI-native future',
	'video-block-newsletter-button-cta-label': 'Continue Watching',
	'video-block-newsletter-tittle': (moduleTitle: string) =>
		`Level up with ${moduleTitle}`,
	'video-block-newsletter-description': `
In exchange for your email address, you'll get full access to this and other free ${config.defaultTitle} tutorials.

Why? First and foremost, your inbox allows us to directly communicate about the latest ${config.defaultTitle} material. This includes free tutorials, NextJS Tips, and periodic update about trends, tools, and NextJS happenings that I'm excited about.

In addition to the piles of free NextJS content, you'll get the earliest access and best discounts to the paid courses when they launch.

There won't be any spam, and every email you get will have an unsubscribe link.

If this sounds like a fair trade, let's go!
	`,
}
