import dynamic from 'next/dynamic'
import { ThemeImage } from '@/components/cld-image'
import { Heading } from '@/components/mdx/heading'
import { TrackLink } from '@/components/mdx/mdx-components'
import type { RawCode } from 'codehike/code'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { remarkMermaid } from '@coursebuilder/mdx-mermaid'
import { Button } from '@coursebuilder/ui'

const Code = dynamic(() =>
	import('@/components/codehike/code').then((mod) => mod.Code),
)
const MDXVideo = dynamic(() => import('@/components/content/mdx-video'))
const PrimaryNewsletterCta = dynamic(() =>
	import('@/components/primary-newsletter-cta').then(
		(mod) => mod.PrimaryNewsletterCta,
	),
)
const SubscribeForm = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.SubscribeForm,
	),
)
const Testimonial = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.Testimonial,
	),
)

/**
 * Compiles MDX content with support for CodeHike and Mermaid diagrams
 *
 * @param source - MDX source content to compile
 * @returns Compiled MDX content
 */
export async function compileMDX(
	source: string,
	components?: Record<string, React.ComponentType<any>>,
) {
	return await _compileMDX({
		source: source,
		components: {
			...components,
			// Use dynamic components
			Code: ({ codeblock }: { codeblock: RawCode }) => (
				<Code codeblock={codeblock} />
			),
			Video: ({ resourceId }: { resourceId: string }) => (
				<MDXVideo resourceId={resourceId} />
			),
			ThemeImage: ({
				urls,
				...props
			}: { urls: { dark: string; light: string } } & CldImageProps) => (
				<ThemeImage urls={urls} {...props} />
			),
			h1: ({ children }) => <Heading level={1}>{children}</Heading>,
			h2: ({ children }) => <Heading level={2}>{children}</Heading>,
			h3: ({ children }) => <Heading level={3}>{children}</Heading>,
			Link: TrackLink,
			Button: ({ children, ...props }) => (
				<Button {...props}>{children}</Button>
			),
			PrimaryNewsletterCta: (props) => <PrimaryNewsletterCta {...props} />,
			SubscribeForm: (props) => <SubscribeForm {...props} />,
			Testimonial: ({
				children,
				authorName,
				authorAvatar,
			}: {
				children: React.ReactNode
				authorName: string
				authorAvatar: string
			}) => (
				<Testimonial authorName={authorName} authorAvatar={authorAvatar}>
					{children}
				</Testimonial>
			),
		},
		options: {
			blockJS: false,
			mdxOptions: {
				remarkPlugins: [
					[
						remarkMermaid,
						{
							// Enable debug mode in development
							debug: process.env.NODE_ENV === 'development',
						},
					],
					remarkGfm,
					[remarkCodeHike, { components: { code: 'Code' } }],
				],
				recmaPlugins: [[recmaCodeHike, { components: { code: 'Code' } }]],
			},
		},
	})
}
