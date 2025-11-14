import dynamic from 'next/dynamic'
import { ThemeImage } from '@/components/cld-image'
import { Heading } from '@/components/mdx/heading'
import { AISummary, TrackLink } from '@/components/mdx/mdx-components'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
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
const DynamicCode = dynamic(() =>
	import('@/components/codehike/code').then((mod) => mod.Code),
)
const DynamicMDXVideo = dynamic(() => import('@/components/content/mdx-video'))

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
			TableWrapper: ({ children }) => <TableWrapper>{children}</TableWrapper>,
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
