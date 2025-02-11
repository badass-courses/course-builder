import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { FilePlus2 } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `Free Next.js Tutorials by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Free Next.js Tutorials by ${config.author}`)}`,
			},
		],
	},
}

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()

	return (
		<main className="container min-h-[calc(100vh-var(--nav-height))] px-5">
			<div className="mx-auto flex h-full w-full max-w-screen-lg flex-col items-center border-x">
				<div className="w-full px-5 pb-16 pt-24">
					<h1 className="font-heading fluid-3xl text-center font-medium">
						Free Next.js Tutorials
					</h1>
				</div>
				<div className="relative w-full">
					<TutorialsList />
					{ability.can('update', 'Content') ? (
						<div className="mx-auto flex w-full items-center justify-center py-16">
							<Button asChild variant="secondary" className="gap-1">
								<Link href={`/tutorials/new`}>
									<FilePlus2 className="h-4 w-4" /> New Tutorial
								</Link>
							</Button>
						</div>
					) : null}
				</div>
			</div>
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
		<ul className="mx-auto mt-8 flex w-full flex-col">
			{publicTutorials.length === 0 && <p>There are no public tutorials.</p>}
			{tutorials.map((tutorial) => (
				<li key={tutorial.id} className="flex">
					<Card className="divide-border bg-background -mt-px flex w-full flex-col items-center divide-y rounded-none border-x-0 shadow-none md:flex-row md:gap-3 md:divide-x md:divide-y-0">
						{tutorial?.fields?.coverImage?.url && (
							<Link
								className="flex flex-shrink-0 items-center justify-center p-5 md:aspect-square"
								href={`/tutorials/${tutorial.fields.slug || tutorial.id}`}
							>
								<CldImage
									className="flex-shrink-0"
									width={240}
									height={240}
									src={tutorial.fields.coverImage.url}
									alt={tutorial.fields.coverImage?.alt || tutorial.fields.title}
								/>
							</Link>
						)}
						<div className="flex h-full w-full flex-col justify-between p-5 md:pl-8">
							<div className="flex h-full flex-col pt-2 md:pt-5">
								<CardHeader className="p-0">
									<CardTitle className="fluid-xl font-semibold">
										<Link
											href={`/tutorials/${tutorial.fields.slug || tutorial.id}`}
											className="hover:text-primary w-full text-balance"
										>
											{tutorial.fields.title}
										</Link>
									</CardTitle>
								</CardHeader>
								{tutorial.fields.description && (
									<CardContent className="px-0 py-3">
										<p className="text-muted-foreground text-base font-normal">
											{tutorial.fields.description}
										</p>
									</CardContent>
								)}
							</div>
							<CardFooter className="flex items-center justify-between gap-3 px-0 pb-3 pt-5">
								<Contributor className="text-sm" />
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
