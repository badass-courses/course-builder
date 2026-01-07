import dynamic from 'next/dynamic'
import {
	CheckList,
	CrossList,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage } from '@/components/cld-image'
import { Heading } from '@/components/mdx/heading'
import { TrackLink } from '@/components/mdx/mdx-components'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import {
	compileMDX as _compileMDX,
	type MDXRemoteProps,
} from 'next-mdx-remote/rsc'
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

// Chat conversation components
const DynamicChatConversation = dynamic(() =>
	import('@/components/mdx/chat-conversation').then(
		(mod) => mod.ChatConversation,
	),
)
const DynamicConcern = dynamic(() =>
	import('@/components/mdx/chat-conversation').then((mod) => mod.Concern),
)
const DynamicResponse = dynamic(() =>
	import('@/components/mdx/chat-conversation').then((mod) => mod.Response),
)
const DynamicChatSetup = dynamic(() =>
	import('@/components/mdx/chat-conversation').then((mod) => mod.ChatSetup),
)
const DynamicChatPunchline = dynamic(() =>
	import('@/components/mdx/chat-conversation').then((mod) => mod.ChatPunchline),
)

// Reasons list components
const DynamicReasonsList = dynamic(() =>
	import('@/components/mdx/reasons-list').then((mod) => mod.ReasonsList),
)
const DynamicReason = dynamic(() =>
	import('@/components/mdx/reasons-list').then((mod) => mod.Reason),
)

// Workshop modules components
const DynamicWorkshopModules = dynamic(() =>
	import('@/components/mdx/workshop-modules').then(
		(mod) => mod.WorkshopModules,
	),
)
const DynamicWorkshopModule = dynamic(() =>
	import('@/components/mdx/workshop-modules').then((mod) => mod.WorkshopModule),
)

// Product contents components
const DynamicProductContents = dynamic(() =>
	import('@/components/mdx/product-contents').then(
		(mod) => mod.ProductContents,
	),
)
const DynamicWorkshop = dynamic(() =>
	import('@/components/mdx/product-contents').then((mod) => mod.Workshop),
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
	options: MDXRemoteProps['options'] = {},
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
			Image: (props) => <CldImage {...props} />,
			CldImage: (props) => <CldImage {...props} />,
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
			CheckList: ({ children }) => <CheckList>{children}</CheckList>,
			CrossList: ({ children }) => <CrossList>{children}</CrossList>,
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
			// Chat conversation components
			ChatConversation: (props: {
				children: React.ReactNode
				header?: string
			}) => <DynamicChatConversation {...props} />,
			Concern: (props: { children: React.ReactNode; emoji?: string }) => (
				<DynamicConcern {...props} />
			),
			Response: (props: { children: React.ReactNode }) => (
				<DynamicResponse {...props} />
			),
			ChatSetup: (props: { children: React.ReactNode }) => (
				<DynamicChatSetup {...props} />
			),
			ChatPunchline: (props: { children: React.ReactNode }) => (
				<DynamicChatPunchline {...props} />
			),
			// Reasons list components
			ReasonsList: (props: { children: React.ReactNode; title?: string }) => (
				<DynamicReasonsList {...props} />
			),
			Reason: (props: {
				children: React.ReactNode
				headline: string
				subline?: string
			}) => <DynamicReason {...props} />,
			// Workshop modules components
			WorkshopModules: (props: { children: React.ReactNode }) => (
				<DynamicWorkshopModules {...props} />
			),
			WorkshopModule: (props: {
				children: React.ReactNode
				title: string
				focus?: string
			}) => <DynamicWorkshopModule {...props} />,
			// Product contents components
			ProductContents: (props: {
				children: React.ReactNode
				title: string
			}) => <DynamicProductContents {...props} />,
			Workshop: (props: { children: React.ReactNode }) => (
				<DynamicWorkshop {...props} />
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
			...options,
		},
	})
}
