import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as Share from '@/components/share'
import { db } from '@/db'
import { isNotNull } from 'drizzle-orm'

import type { ResourceProgress } from '@coursebuilder/core/schemas'
import { Gravatar } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { achievements } from '../_components/achievements'

type Props = {
	params: Promise<{ id: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getPublicProfile(shortId: string) {
	// Query using LIKE to match the start of the UUID
	// Most SQL databases index this efficiently
	return await db.query.users.findFirst({
		where: (profiles, { like }) => like(profiles.id, `${shortId}%`),
	})
}

async function getUserProgress(userId: string) {
	return await db.query.resourceProgress.findMany({
		where: (resourceProgress, { eq, and }) =>
			and(
				eq(resourceProgress.userId, userId),
				isNotNull(resourceProgress.completedAt),
			),
		orderBy: (resourceProgress, { desc }) => [
			desc(resourceProgress.completedAt),
		],
	})
}

async function getResources(resourceIds: string[]) {
	return await db.query.contentResource.findMany({
		where: (resources, { inArray }) => inArray(resources.id, resourceIds),
	})
}

export default async function ProfilePage({ params }: Props) {
	const id = (await params).id
	// We can use first 8 characters of the UUID
	const profile = await getPublicProfile(id)

	if (!profile) {
		notFound()
	}

	const userProgress = await getUserProgress(profile.id)
	const resourceIds = userProgress
		.map((p) => p.resourceId)
		.filter((id): id is string => id !== null)
	const resources = await getResources(resourceIds)
	const unlockedAchievements = achievements.filter((achievement) =>
		achievement.check(userProgress),
	)

	return (
		<div className="max-w-(--breakpoint-lg) container">
			<div className="flex w-full grid-cols-2 flex-col items-center justify-between border-b py-8 lg:grid">
				<div className="flex items-center gap-5">
					{profile?.image ? (
						<Image
							src={profile.image}
							alt={profile.name || ''}
							width={96}
							height={96}
							className="rounded"
						/>
					) : (
						<Gravatar
							className="w-24 rounded"
							email={profile.email}
							default="mp"
						/>
					)}
					<div className="flex flex-col">
						<h1 className="font-heading text-xl font-bold sm:text-3xl">
							{profile.name}
						</h1>
						<p className="text-muted-foreground">
							{profile.role === 'admin' && '⭐️ Admin ・'} Member since{' '}
							{profile.createdAt?.toLocaleDateString()}
						</p>
					</div>
				</div>
				{/* <div>
					<strong className="text-primary">
						[ Next Recommended Resource for user goes here ]
					</strong>
				</div> */}
			</div>
			<div className="flex grid-cols-2 flex-col gap-10 py-8 md:grid">
				<div className="">
					<strong>
						{unlockedAchievements.length} / {achievements.length} Achievements
					</strong>
					<div className="mt-4 flex flex-wrap gap-4">
						{achievements.map((achievement) => {
							const unlocked = unlockedAchievements.includes(achievement)
							return (
								<div
									key={achievement.id}
									className={cn(
										'flex w-full flex-row items-center justify-start gap-5 rounded-lg border p-5 lg:gap-8 lg:p-8',
										{
											'bg-primary/10 border-primary': unlocked,
											'opacity-50': !unlocked,
										},
									)}
								>
									<span className="text-xl sm:text-3xl">
										{achievement.icon}
									</span>
									<div>
										<h4 className="my-1 text-lg font-bold">
											{achievement.name}
										</h4>
										<p className="text-muted-foreground text-sm">
											{achievement.description}
										</p>
									</div>
								</div>
							)
						})}
					</div>
					{unlockedAchievements.length > 0 && (
						<div className="py-4">
							<strong className="">Share</strong>
							<Share.Root className="mt-2 flex flex-row flex-wrap gap-1 sm:items-center">
								<Share.Bluesky />
								<Share.X />
								<Share.LinkedIn />
								<Share.CopyUrl />
							</Share.Root>
						</div>
					)}
				</div>
				<div className="flex flex-col">
					<strong>History</strong>
					{userProgress.length > 0 ? (
						<div className="mt-4 space-y-6">
							{Object.entries(groupByMonth(userProgress))
								.sort(
									(a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
								)
								.map(([month, progressItems]) => (
									<div key={month}>
										<h3 className="mb-1 font-sans text-sm font-semibold">
											{month}
										</h3>
										<ul
											data-checklist=""
											className="opacity-80 hover:opacity-100"
										>
											{progressItems.map((progress) => {
												const resource = resources?.find(
													(r) => r.id === progress.resourceId,
												)
												return (
													<li className="py-1" key={progress.resourceId}>
														<Link
															href={`/${resource?.fields?.slug}`}
															className="pl-0.5 text-base font-medium hover:underline"
														>
															{resource?.fields?.title}
														</Link>
													</li>
												)
											})}
										</ul>
									</div>
								))}
						</div>
					) : (
						<Link href="/posts" className="text-primary mt-4">
							Start learning!
						</Link>
					)}
				</div>
			</div>
			{/* Add your profile UI here */}
		</div>
	)
}
function groupByMonth(progress: ResourceProgress[]) {
	return progress.reduce(
		(groups, item) => {
			const date = new Date(item.completedAt!)
			const key = date.toLocaleString('en-US', {
				month: 'long',
				year: 'numeric',
			})
			if (!groups[key]) {
				groups[key] = []
			}
			groups[key]!.push(item)
			return groups
		},
		{} as Record<string, ResourceProgress[]>,
	)
}
