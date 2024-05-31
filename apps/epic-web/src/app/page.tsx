import * as React from 'react'
import { type Metadata } from 'next'
import { Landing } from '@/app/_components/landing'
import { coursebuilder } from '@/coursebuilder/course-builder-config'
import { env } from '@/env.mjs'

export const metadata: Metadata = {
	title: env.NEXT_PUBLIC_SITE_TITLE,
	description:
		'Learn full-stack web development with Kent C. Dodds and the Epic Web instructors. Learn TypeScript, React, Node.js, and more through hands-on workshops.',
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
