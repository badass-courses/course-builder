import config from '@/config'

export default {
	'primary-newsletter-button-cta-label': 'Sign Up',
	'primary-newsletter-tittle':
		'Get the latest Astro news, tutorials, and updates delivered to your inbox.',
	'primary-newsletter-subtitle':
		'Become essential to your business and ship design that matters.',
	'tip-newsletter-button-cta-label': 'Subscribe, friend!',
	'tip-newsletter-tittle': 'New Astro tips delivered to your inbox:',
	'video-block-newsletter-button-cta-label': 'Continue Watching',
	'video-block-newsletter-tittle': (moduleTitle: string) =>
		`Level up with ${moduleTitle}`,
	'video-block-newsletter-description': `
In exchange for your email address, you'll get full access to this and other free ${config.defaultTitle} tutorials.

Why? First and foremost, your inbox allows us to directly communicate about the latest ${config.defaultTitle} material. This includes free tutorials, Astro Tips, and periodic update about trends, tools, and happenings that I'm excited about.

In addition to the piles of free Astro content, you'll get the earliest access and best discounts to the paid courses when they launch.

There won't be any spam, and every email you get will have an unsubscribe link.

If this sounds like a fair trade, let's go!
	`,
}
