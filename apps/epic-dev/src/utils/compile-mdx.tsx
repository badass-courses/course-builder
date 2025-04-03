import Link from 'next/link'
import { Testimonial } from '@/app/admin/pages/_components/page-builder-mdx-components'
import { ThemeImage } from '@/components/cld-image'
import { Code } from '@/components/codehike/code'
import Scrollycoding from '@/components/codehike/scrollycoding'
import MDXVideo from '@/components/content/mdx-video'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import type { CldImageProps } from 'next-cloudinary'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { remarkMermaid } from '@coursebuilder/mdx-mermaid'
import { Mermaid } from '@coursebuilder/mdx-mermaid/client'
import { Button } from '@coursebuilder/ui'

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
			// @ts-expect-error
			Code,
			Scrollycoding,

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
