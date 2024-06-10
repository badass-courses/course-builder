import * as React from 'react'
import { type Metadata } from 'next'
import { HomeHeader } from '@/app/_components/home-header'
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
		<>
			<HomeHeader />
		</>
	)
}
