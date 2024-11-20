import config from '@/config'

export default {
	'primary-newsletter-button-cta-label': 'Subscribe',
	'primary-newsletter-tittle':
		'Subscribe to be the first to learn about AI Hero releases, updates, and special discounts for AI Engineers.',
	'primary-newsletter-byline': `We're in this together!`,
	'tip-newsletter-button-cta-label': 'Subscribe',
	'tip-newsletter-tittle': 'New AI Engineering tips delivered to your inbox:',
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
