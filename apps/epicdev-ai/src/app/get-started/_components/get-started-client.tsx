'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { type Page } from '@/lib/pages'
import { type Workshop } from '@/lib/workshops'
import Balancer from 'react-wrap-balancer'

import WorkshopAppScreenshot from './workshop-app-screenshot'

interface GetStartedClientProps {
	page: Page
	workshops: Workshop[]
	pageTitle: string
	pageDescription: string
	children: React.ReactNode
}

export default function GetStartedClient({
	page,
	workshops,
	pageTitle,
	pageDescription,
	children,
}: GetStartedClientProps) {
	const searchParams = useSearchParams()
	const moduleSlug = searchParams.get('module')
	const currentModule = [...workshops].find(
		(module) => module.fields.slug === moduleSlug,
	)
	const githubUrlForCurrentModule = currentModule?.fields.github

	React.useEffect(() => {}, [])

	return (
		<>
			<header className="mx-auto flex w-full max-w-screen-md flex-col items-center justify-center px-5 pb-16 pt-10 sm:pt-14">
				<h1 className="text-center text-3xl font-bold sm:text-4xl lg:text-5xl">
					<Balancer>{pageTitle}</Balancer>
				</h1>
				{githubUrlForCurrentModule ? (
					<Link
						className="bg-primary text-primary-foreground mt-10 flex items-center gap-3 rounded-md px-5 py-1 font-semibold transition"
						href={`${githubUrlForCurrentModule}?tab=readme-ov-file#setup`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{currentModule.fields.coverImage?.url && (
							<Image
								src={currentModule.fields.coverImage.url}
								width={50}
								height={50}
								aria-hidden
								alt=""
							/>
						)}{' '}
						<span className="drop-shadow-md">{currentModule.fields.title}</span>
					</Link>
				) : null}
				<h2 className="pb-8 pt-8 text-center text-lg text-gray-700 sm:text-xl lg:text-2xl dark:text-gray-300">
					<Balancer>{pageDescription}</Balancer>
				</h2>
				<WorkshopAppScreenshot />
			</header>
			<main className="prose dark:prose-invert md:prose-lg prose-headings:pt-8 mx-auto w-full max-w-screen-md px-5 pb-16">
				{page.fields.body ? children : null}
			</main>
		</>
	)
}
