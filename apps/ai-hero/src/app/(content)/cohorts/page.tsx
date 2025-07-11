import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { CohortSchema } from '@/lib/cohort'
import { getServerAuthSession } from '@/server/auth'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { formatInTimeZone } from 'date-fns-tz'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Cohorts hosted by Matt Pocock',
}

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()

	return (
		<LayoutClient withContainer>
			<main className="container relative flex h-full min-h-[calc(100vh-var(--nav-height))] flex-col items-center px-0 lg:border-x">
				<div className="max-w-(--breakpoint-md) w-full border-b px-5 py-16 md:border-dashed">
					<h1 className="font-heading text-center text-5xl font-bold">
						<span className="text-stroke-1 text-stroke-primary text-stroke-fill-background">
							Live
						</span>{' '}
						<span className="text-gray-100">Cohorts</span>
					</h1>
				</div>
				<CohortsList />
				{ability.can('update', 'Content') ? (
					<div className="max-w-(--breakpoint-md) mx-auto mt-10 flex w-full items-center justify-center border-t border-dashed py-10">
						<Button asChild variant="secondary">
							<Link href={`/cohorts/new`}>New Cohort</Link>
						</Button>
					</div>
				) : null}
				<div
					className="max-w-(--breakpoint-md) absolute top-0 -z-10 h-full w-full border-dashed md:border-x"
					aria-hidden="true"
				/>
			</main>
		</LayoutClient>
	)
}

async function CohortsList() {
	const { ability } = await getServerAuthSession()
	const cohortsModule = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'cohort'),
		with: {
			resources: true,
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})
	const parsedCohortsModule = z.array(CohortSchema).parse(cohortsModule)

	const cohorts = [...parsedCohortsModule].filter((cohort) => {
		if (ability.can('create', 'Content')) {
			return cohort
		} else {
			return cohort?.fields?.visibility === 'public'
		}
	})

	const publicCohorts = [...cohortsModule].filter(
		(cohort) => cohort?.fields?.visibility === 'public',
	)

	return (
		<ul className="max-w-(--breakpoint-md) mx-auto mt-8 flex w-full flex-col gap-5 px-8 md:px-8">
			{publicCohorts.length === 0 && <p>There are no public cohorts.</p>}
			{cohorts.map((cohort) => {
				const { fields } = cohort
				const { startsAt, endsAt } = fields
				const PT = fields.timezone || 'America/Los_Angeles'

				const { dateString: cohortDateString } = formatCohortDateRange(
					startsAt,
					endsAt,
					PT,
				)

				return (
					<li key={cohort.id}>
						<Card className="bg-background flex flex-col items-center gap-3 rounded-none border-none p-0 md:flex-row">
							{cohort?.fields?.image && (
								<Link
									className="shrink-0"
									href={`/cohorts/${cohort.fields.slug || cohort.id}`}
								>
									<CldImage
										className="shrink-0"
										width={200}
										height={200}
										src={cohort.fields.image}
										alt={cohort.fields.title}
									/>
								</Link>
							)}
							<div className="w-full">
								<CardHeader className="mb-2 p-0">
									<CardTitle className="text-lg font-normal text-gray-100 sm:text-2xl">
										<Link
											href={`/cohorts/${cohort.fields.slug || cohort.id}`}
											className="w-full text-balance hover:underline"
										>
											{cohort?.fields?.title}
										</Link>
									</CardTitle>
									<div className="flex items-center gap-1 text-sm">
										{cohortDateString && <p>{cohortDateString}</p>}
									</div>
								</CardHeader>
								{cohort?.fields?.description && (
									<CardContent className="px-0 py-3">
										<p className="text-muted-foreground text-base">
											{cohort?.fields?.description}
										</p>
									</CardContent>
								)}
								<CardFooter className="flex items-center justify-between gap-3 px-0 py-3">
									<Contributor className="text-sm font-light" />
									<div className="flex items-center gap-2">
										{ability.can('create', 'Content') && (
											<>
												<span className="text-sm">
													{cohort?.fields?.visibility}
												</span>
												<Button asChild variant="outline" size="sm">
													<Link
														href={`/cohorts/${cohort?.fields?.slug || cohort.id}/edit`}
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
				)
			})}
		</ul>
	)
}
