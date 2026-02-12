'use client'

import { X } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote'
import { ErrorBoundary } from 'react-error-boundary'

import { Button } from '@coursebuilder/ui'

import { useMDXPreview } from './mdx-preview-provider'
import { allMdxPageBuilderComponents } from './page-builder-mdx-components'

export default function MDXLivePreview() {
	const { mdxContent, togglePreviewPanel } = useMDXPreview()
	return (
		<div className="bg-background max-w-(--breakpoint-xl) w-full">
			<div className="flex items-center justify-between border-b px-5 py-3">
				<h3 className="flex text-lg font-bold">Preview</h3>
				<Button variant="ghost" onClick={togglePreviewPanel} size="icon">
					<X className="h-5 w-5" />
				</Button>
			</div>
			<ErrorBoundary fallback={<p>Error</p>} resetKeys={[mdxContent]}>
				{mdxContent && (
					<article className="prose dark:prose-invert sm:prose-lg prose-headings:mx-auto prose-headings:max-w-(--breakpoint-md) prose-p:mx-auto prose-p:max-w-(--breakpoint-md) prose-ul:mx-auto prose-ul:max-w-(--breakpoint-md) prose-img:mx-auto prose-img:max-w-(--breakpoint-md) mx-auto max-w-none p-5">
						<MDXRemote
							// @ts-expect-error
							components={allMdxPageBuilderComponents}
							{...mdxContent}
						/>
					</article>
				)}
			</ErrorBoundary>
		</div>
	)
}
