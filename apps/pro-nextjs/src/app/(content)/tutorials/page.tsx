import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `Pro Next.js Tutorials by ${config.author}`,
}

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()

	return (
		<main className="container relative flex h-full min-h-[calc(100vh-var(--nav-height))] flex-col items-center px-0">
			<div className="w-full max-w-screen-md px-5 py-16">
				<h1 className="font-heading text-center text-5xl font-bold">
					Free Next.js Tutorials
				</h1>
			</div>
			<TutorialsList />
			{ability.can('update', 'Content') ? (
				<div className="mx-auto mt-10 flex w-full max-w-screen-md items-center justify-center py-10">
					<Button asChild variant="secondary">
						<Link href={`/tutorials/new`}>New Tutorial</Link>
					</Button>
				</div>
			) : null}
		</main>
	)
}

async function TutorialsList() {
	const tutorialsModule = await getAllTutorials()
	const { ability } = await getServerAuthSession()
	const tutorials = [...tutorialsModule].filter((tutorial) => {
		if (ability.can('create', 'Content')) {
			return tutorial
		} else {
			return tutorial.fields.visibility === 'public'
		}
	})
	const publicTutorials = [...tutorialsModule].filter(
		(tutorial) => tutorial.fields.visibility === 'public',
	)

	return (
		<ul className="mx-auto mt-8 flex w-full max-w-screen-md flex-col gap-5 px-8 md:px-8">
			{publicTutorials.length === 0 && <p>There are no public tutorials.</p>}
			{tutorials.map((tutorial) => (
				<li key={tutorial.id}>
					<Card className="flex flex-col items-center gap-3 p-5 md:flex-row">
						{tutorial?.fields?.coverImage?.url && (
							<Link
								className="flex-shrink-0"
								href={`/tutorials/${tutorial.fields.slug || tutorial.id}`}
							>
								<CldImage
									className="flex-shrink-0"
									width={200}
									height={200}
									src={tutorial.fields.coverImage.url}
									alt={tutorial.fields.coverImage?.alt || tutorial.fields.title}
								/>
							</Link>
						)}
						<div className="w-full">
							<CardHeader className="p-0">
								<CardTitle className="text-lg font-bold sm:text-2xl">
									<Link
										href={`/tutorials/${tutorial.fields.slug || tutorial.id}`}
										className="w-full text-balance hover:underline"
									>
										{tutorial.fields.title}
									</Link>
								</CardTitle>
							</CardHeader>
							{tutorial.fields.description && (
								<CardContent className="px-0 py-3">
									<p className="text-muted-foreground text-base">
										{tutorial.fields.description}
									</p>
								</CardContent>
							)}
							<CardFooter className="flex items-center justify-between gap-3 px-0 py-3">
								<Contributor className="text-sm font-light" />
								<div className="flex items-center gap-2">
									{ability.can('create', 'Content') && (
										<>
											<span className="text-sm">
												{tutorial.fields.visibility}
											</span>
											<Button asChild variant="outline" size="sm">
												<Link
													href={`/tutorials/${tutorial.fields.slug || tutorial.id}/edit`}
												>
													Edit
												</Link>
											</Button>
										</>
									)}
								</div>
							</CardFooter>
						</div>
					</Card>
				</li>
			))}
		</ul>
	)
}
