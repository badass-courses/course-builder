const config = {
	defaultTitle: `${process.env.NEXT_PUBLIC_SITE_TITLE}`,
	description: process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
	author: `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`,
	additionalLinkTags: [
		{
			rel: 'icon',
			href: `${process.env.NEXT_PUBLIC_URL}/favicon.svg`,
		},
		{
			rel: 'mask-icon',
			href: `${process.env.NEXT_PUBLIC_URL}/favicon.svg`,
			color: '#363438',
		},
		{
			rel: 'apple-touch-icon',
			href: `${process.env.NEXT_PUBLIC_URL}/apple-touch-icon.png`,
		},
	],
	additionalMetaTags: [
		{
			property: 'author',
			content: `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`,
		},
		{
			property: 'keywords',
			content: process.env.NEXT_PUBLIC_SEO_KEYWORDS!,
		},
	],
	twitter: {
		cardType: 'summary_large_image',
		handle: `@${process.env.NEXT_PUBLIC_PARTNER_TWITTER}`,
	},
	bluesky: {
		handle: `@${process.env.NEXT_PUBLIC_PARTNER_BLUESKY}`,
	},
	sameAs: [`https://twitter.com/${process.env.NEXT_PUBLIC_PARTNER_TWITTER}`],
	openGraph: {
		type: 'website',
		site_name: process.env.NEXT_PUBLIC_SITE_TITLE,
		profile: {
			firstName: process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME,
			lastName: process.env.NEXT_PUBLIC_PARTNER_LAST_NAME,
		},
		images: [
			{
				url: `https://res.cloudinary.com/dbdlunqwz/image/upload/v1770026380/card_2x_x1ei3j.jpg`,
				width: 1200,
				height: 630,
			},
		],
	},
}

export default config
