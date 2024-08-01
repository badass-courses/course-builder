import * as React from 'react'
import { type Metadata } from 'next'
import { Landing } from '@/app/_components/landing'
import { coursebuilder } from '@/coursebuilder/course-builder-config'

export const metadata: Metadata = {
	title: 'JS Visualized',
	description: 'JS Visualized Course',
}

export default async function PlaygroundPage() {
	const cb = await coursebuilder()
	return (
		<div className="container pb-28">
			<article className="prose sm:prose-xl dark:prose-invert prose-code:font-bold prose-code:font-sans max-w-none">
				<Landing />
			</article>
		</div>
	)
}
