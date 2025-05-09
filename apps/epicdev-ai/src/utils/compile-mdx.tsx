import dynamic from 'next/dynamic'
import { Heading } from '@/components/mdx/heading'
import { TrackLink } from '@/components/mdx/mdx-components'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { remarkMermaid } from '@coursebuilder/mdx-mermaid'
import { Button } from '@coursebuilder/ui'

// Dynamically import heavy components
const DynamicCode = dynamic(() =>
	import('@/components/codehike/code').then((mod) => mod.Code),
)
const DynamicScrollycoding = dynamic(
	() => import('@/components/codehike/scrollycoding'),
)
const DynamicMermaid = dynamic(() =>
	import('@coursebuilder/mdx-mermaid/client').then((mod) => mod.Mermaid),
)
const DynamicMDXVideo = dynamic(() => import('@/components/content/mdx-video'))
const DynamicThemeImage = dynamic(() =>
	import('@/components/cld-image').then((mod) => mod.ThemeImage),
)
const DynamicPrimaryNewsletterCta = dynamic(() =>
	import('@/components/primary-newsletter-cta').then(
		(mod) => mod.PrimaryNewsletterCta,
	),
)

// Dynamically import components from page-builder-mdx-components
const DynamicCallout = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.Callout,
	),
)

const DynamicYouTubeVideo = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.YouTubeVideo,
	),
)

const DynamicSubscribeForm = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.SubscribeForm,
	),
)
const DynamicTestimonial = dynamic(() =>
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
			Code: (props) => <DynamicCode {...props} />,
			Scrollycoding: (props) => <DynamicScrollycoding {...props} />,
			Mermaid: (props) => (
				<DynamicMermaid
					{...props}
					className="flex w-full max-w-4xl items-center justify-center rounded-lg border bg-white py-10 dark:bg-transparent"
					config={{
						theme: 'base',
						themeVariables: {
							fontSize: '16px',
						},
					}}
				/>
			),
			Video: ({ resourceId }: { resourceId: string }) => (
				<DynamicMDXVideo resourceId={resourceId} />
			),
			YouTubeVideo: ({ videoId }: { videoId: string }) => (
				<DynamicYouTubeVideo videoId={videoId} />
			),
			ThemeImage: ({
				urls,
				...props
			}: { urls: { dark: string; light: string } } & CldImageProps) => (
				<DynamicThemeImage urls={urls} {...props} />
			),
			h1: ({ children }) => <Heading level={1}>{children}</Heading>,
			h2: ({ children }) => <Heading level={2}>{children}</Heading>,
			h3: ({ children }) => <Heading level={3}>{children}</Heading>,
			Link: TrackLink,
			Button: ({ children, ...props }) => (
				<Button {...props}>{children}</Button>
			),
			PrimaryNewsletterCta: (props) => (
				<DynamicPrimaryNewsletterCta {...props} />
			),
			SubscribeForm: (props) => <DynamicSubscribeForm {...props} />,
			Callout: (props) => <DynamicCallout {...props} />,
			Testimonial: ({
				children,
				authorName,
				authorAvatar,
			}: {
				children: React.ReactNode
				authorName: string
				authorAvatar: string
			}) => (
				<DynamicTestimonial authorName={authorName} authorAvatar={authorAvatar}>
					{children}
				</DynamicTestimonial>
			),
		},
		options: {
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
