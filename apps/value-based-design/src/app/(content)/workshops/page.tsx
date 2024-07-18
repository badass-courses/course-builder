import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getAllWorkshops } from '@/lib/workshops-query'
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
	title: `Value-Based Design Workshops by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Value-Based Design Workshops by ${config.author}`)}`,
			},
		],
	},
}

export default async function Workshops() {
	const { ability } = await getServerAuthSession()

	return (
		<main className="container min-h-[calc(100vh-var(--nav-height))] px-5">
			<div className="mx-auto flex h-full w-full max-w-screen-lg flex-col items-center border-x">
				<div className="w-full px-5 pb-16 pt-24">
					<h1 className="font-heading fluid-3xl text-center font-medium">
						Value-Based Design Workshops
					</h1>
				</div>
				<div className="relative w-full">
					<WorkshopsList />
					{ability.can('update', 'Content') ? (
						<div className="mx-auto flex w-full items-center justify-center py-16">
							<Button asChild variant="secondary" className="gap-1">
								<Link href={`/workshops/new`}>
									<FilePlus2 className="h-4 w-4" /> New Workshop
								</Link>
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</main>
	)
}

async function WorkshopsList() {
	const workshopsModule = await getAllWorkshops()
	const { ability } = await getServerAuthSession()

	const workshops = [...workshopsModule].filter((tutorial) => {
		if (ability.can('create', 'Content')) {
			return tutorial
		} else {
			return tutorial.fields.visibility === 'public'
		}
	})
	const publicWorkshops = [...workshopsModule].filter(
		(tutorial) => tutorial.fields.visibility === 'public',
	)

	return (
		<ul className="mx-auto mt-8 flex w-full flex-col">
			{publicWorkshops.length === 0 && (
				<p className="p-5">There are no public workshops.</p>
			)}
			{workshops.map((workshop) => (
				<li key={workshop.id} className="flex">
					<Card className="divide-border bg-background -mt-px flex w-full flex-col items-center divide-y rounded-none border-x-0 shadow-none md:flex-row md:gap-3 md:divide-x md:divide-y-0">
						{workshop?.fields?.coverImage?.url && (
							<Link
								className="flex flex-shrink-0 items-center justify-center p-5 md:aspect-square"
								href={`/workshops/${workshop.fields.slug || workshop.id}`}
							>
								<CldImage
									className="flex-shrink-0"
									width={240}
									height={240}
									src={workshop.fields.coverImage.url}
									alt={workshop.fields.coverImage?.alt || workshop.fields.title}
								/>
							</Link>
						)}
						<div className="flex h-full w-full flex-col justify-between p-5 md:pl-8">
							<div className="flex h-full flex-col pt-2 md:pt-5">
								<CardHeader className="p-0">
									<CardTitle className="fluid-xl font-semibold">
										<Link
											href={`/workshops/${workshop.fields.slug || workshop.id}`}
											className="hover:text-primary w-full text-balance"
										>
											{workshop.fields.title}
										</Link>
									</CardTitle>
								</CardHeader>
								{workshop.fields.description && (
									<CardContent className="px-0 py-3">
										<p className="text-muted-foreground text-base font-normal">
											{workshop.fields.description}
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
												{workshop.fields.visibility}
											</span>
											<Button asChild variant="outline" size="sm">
												<Link
													href={`/workshops/${workshop.fields.slug || workshop.id}/edit`}
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
