import dynamic from 'next/dynamic'
import {
	CheckList,
	Recommendation,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import { Heading } from '@/components/mdx/heading'
import { AISummary, TrackLink } from '@/components/mdx/mdx-components'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import {
	compileMDX as _compileMDX,
	type MDXRemoteProps,
} from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { remarkMermaid } from '@coursebuilder/mdx-mermaid'
import { Button } from '@coursebuilder/ui'

const Scrollycoding = dynamic(
	() => import('@/components/codehike/scrollycoding'),
)
const Mermaid = dynamic(() =>
	import('@coursebuilder/mdx-mermaid/client').then((mod) => mod.Mermaid),
)
const Testimonial = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.Testimonial,
	),
)
const TableWrapper = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.TableWrapper,
	),
)
const Spoiler = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.Spoiler,
	),
)
const DynamicCode = dynamic(() =>
	import('@/components/codehike/code').then((mod) => mod.Code),
)
const DynamicMDXVideo = dynamic(() => import('@/components/content/mdx-video'))
const DynamicProjectVideo = dynamic(() =>
	import('@/app/admin/pages/_components/page-builder-mdx-components').then(
		(mod) => mod.ProjectVideo,
	),
)
const DynamicMDXCheckbox = dynamic(() =>
	import('@/components/mdx-checkbox').then((mod) => mod.MDXCheckbox),
)

/**
 * Compiles MDX content with support for CodeHike and Mermaid diagrams
 *
 * @param source - MDX source content to compile
 * @param options - Options to compile the MDX content in
 * @param options.scope - Scope to compile the MDX content in
 * @param components - Components to use in the MDX content
 * @param context - Optional context for components (e.g., lessonId for checkboxes)
 * @returns Compiled MDX content
 */
export async function compileMDX(
	source: string,
	components: MDXRemoteProps['components'] = {},
	options: MDXRemoteProps['options'] = {},
	context?: { lessonId?: string },
) {
	let checkboxIndex = 0
	return await _compileMDX({
		source: source,
		components: {
			...components,
			input: (props: React.InputHTMLAttributes<HTMLInputElement>) => {
				if (props.type === 'checkbox' && context?.lessonId) {
					const currentIndex = checkboxIndex++
					return (
						<DynamicMDXCheckbox
							{...props}
							lessonId={context.lessonId}
							index={currentIndex}
						/>
					)
				}
				return <input {...props} />
			},
			Code: (props) => <DynamicCode {...props} />,
			Scrollycoding: (props) => <Scrollycoding {...props} />,
			AISummary,
			Mermaid: (props) => (
				<Mermaid
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
			Video: ({
				resourceId,
				thumbnailTime,
				poster,
			}: {
				resourceId: string
				thumbnailTime?: number
				poster?: string
			}) => (
				<DynamicMDXVideo
					resourceId={resourceId}
					thumbnailTime={thumbnailTime}
					poster={poster}
				/>
			),
			ThemeImage: ({
				urls,
				...props
			}: { urls: { dark: string; light: string } } & CldImageProps) => (
				<ThemeImage urls={urls} {...props} />
			),
			CheckList: ({ children }) => <CheckList>{children}</CheckList>,
			h1: ({ children }) => <Heading level={1}>{children}</Heading>,
			h2: ({ children }) => <Heading level={2}>{children}</Heading>,
			h3: ({ children }) => <Heading level={3}>{children}</Heading>,
			Link: TrackLink,
			AIOnly: ({ children }) => (
				<span className="opacity-50" data-ai-only="">
					{children}
				</span>
			),
			Button: ({ children, ...props }) => (
				<Button {...props}>{children}</Button>
			),
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
			Recommendation: ({ children, exerciseId }) => (
				<Recommendation exerciseId={exerciseId}>{children}</Recommendation>
			),
			TableWrapper: ({ children }) => <TableWrapper>{children}</TableWrapper>,
			Spoiler: ({ children }) => <Spoiler>{children}</Spoiler>,
			ProjectVideo: ({ resourceId, exerciseId, recommendation }) => (
				<DynamicProjectVideo
					resourceId={resourceId}
					exerciseId={exerciseId}
					recommendation={recommendation}
				/>
			),
			CldImage: (props) => <CldImage {...props} />,
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
			...options,
		},
	})
}
