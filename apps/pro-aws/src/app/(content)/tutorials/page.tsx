import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
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
	title: 'ProAWS Tutorials by Adam Elmore',
}

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()

	return (
		<main className="container relative flex h-full min-h-[calc(100vh-var(--nav-height))] flex-col items-center lg:border-x">
			<div className=" w-full max-w-screen-md border-b py-16 md:border-dashed">
				<h1 className="font-heading text-center text-5xl font-bold">
					<span className="text-stroke-1 text-stroke-primary text-stroke-fill-background">
						Free
					</span>{' '}
					<span className="text-gray-100">AWS Tutorials</span>
				</h1>
			</div>
			<TutorialsList />
			{ability.can('update', 'Content') ? (
				<div className="mx-auto mt-10 flex w-full max-w-screen-md items-center justify-center border-t border-dashed py-10">
					<Button asChild variant="secondary">
						<Link href={`/tutorials/new`}>New Tutorial</Link>
					</Button>
				</div>
			) : null}
			<div
				className="absolute top-0 -z-10 h-full w-full max-w-screen-md border-dashed md:border-x"
				aria-hidden="true"
			/>
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
		<ul className="mx-auto mt-8 flex w-full max-w-screen-md flex-col gap-5 md:px-8">
			{publicTutorials.length === 0 && <p>There are no public tutorials.</p>}
			{tutorials.map((tutorial) => (
				<li key={tutorial.id}>
					<Card className="bg-background flex flex-col items-center gap-3 rounded-none border-none p-0 md:flex-row">
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
						<div>
							<CardHeader className="p-0">
								<CardTitle className="text-lg font-normal text-gray-100 sm:text-2xl">
									<h2>
										<Link
											href={`/tutorials/${tutorial.fields.slug || tutorial.id}`}
											className="w-full text-balance hover:underline"
										>
											{tutorial.fields.title}
										</Link>
									</h2>
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
