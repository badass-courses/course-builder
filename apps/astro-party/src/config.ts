const config = {
	defaultTitle: `${process.env.NEXT_PUBLIC_SITE_TITLE}`,
	description: process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
	author: `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`,
	additionalLinkTags: [
		{
			rel: 'icon',
			href: `${process.env.NEXT_PUBLIC_URL}/favicon.ico`,
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
	sameAs: [
		`https://jason.energy`,
		`https://www.linkedin.com/in/jlengstorf`,
		'https://www.learnwithjason.dev',
	],
	openGraph: {
		type: 'website',
		site_name: process.env.NEXT_PUBLIC_SITE_TITLE,
		profile: {
			firstName: process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME,
			lastName: process.env.NEXT_PUBLIC_PARTNER_LAST_NAME,
		},
		images: [
			{
				url: `card@2x.png`,
				width: 1200,
				height: 630,
			},
		],
	},
}

export default config
