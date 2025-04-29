import dynamic from 'next/dynamic'
import { ThemeImage } from '@/components/cld-image'
import { Code } from '@/components/codehike/code'
import MDXVideo from '@/components/content/mdx-video'
import { Heading } from '@/components/mdx/heading'
import { AISummary, TrackLink } from '@/components/mdx/mdx-components'
import type { RawCode } from 'codehike/code'
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

/**
 * Compiles MDX content with support for CodeHike and Mermaid diagrams
 *
 * @param source - MDX source content to compile
 * @returns Compiled MDX content
 */
export async function compileMDX(source: string) {
	return await _compileMDX({
		source: source,
		components: {
			Code: ({ codeblock }: { codeblock: RawCode }) => (
				<Code codeblock={codeblock} />
			),
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
