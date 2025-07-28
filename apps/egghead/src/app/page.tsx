import * as React from 'react'
import { type Metadata } from 'next'
import { Landing } from '@/app/_components/landing'
import { coursebuilder } from '@/coursebuilder/course-builder-config'
import { getOGImageBaseUrl } from '@/utils/get-og-image-url-for-resource'

export const metadata: Metadata = {
	title: 'egghead Post Builder',
	description:
		'egghead Post Builder for building egghead courses with Course Builder',
	openGraph: {
		images: [
			{
				url: `${getOGImageBaseUrl()}/api/og?title=${encodeURIComponent('egghead Post Builder - Build Professional Programming Content')}`,
			},
		],
	},
}

export default async function PlaygroundPage() {
	const cb = await coursebuilder()

	return (
		<main>
			<article className="prose sm:prose-lg dark:prose-invert mx-auto w-full max-w-2xl px-5 py-8 sm:py-16">
				<Landing />
			</article>
		</main>
	)
}
