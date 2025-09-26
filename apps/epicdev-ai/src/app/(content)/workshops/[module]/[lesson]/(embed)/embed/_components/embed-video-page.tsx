import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { getLessonMuxPlaybackId } from '@/lib/lessons-query'
import { getLesson } from '@/lib/lessons/lessons.service'
import { getModuleProgressForUser } from '@/lib/progress'
import {
	getSolutionForLesson,
	getVideoResourceForSolution,
} from '@/lib/solutions-query'
import {
	getCachedMinimalWorkshop,
	getWorkshopCohort,
	getWorkshopProduct,
} from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'
import { formatInTimeZone } from 'date-fns-tz'
import { eq, sql } from 'drizzle-orm'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { EmbedContainer } from './embed-container'
import { EmbedVideoPlayer } from './embed-video-player'
import { LoginPrompt } from './login-prompt'

type EmbedVideoPageProps = {
	lessonSlug: string
	moduleSlug: string
	resourceType?: 'lesson' | 'solution'
}

/**
 * Reusable embed video page component that handles both lesson and solution videos
 * Uses session authentication that works across iframe boundaries
 */
export async function EmbedVideoPage({
	lessonSlug,
	moduleSlug,
	resourceType = 'lesson',
}: EmbedVideoPageProps) {
	// First, get the lesson data (needed for both lesson and solution)
	const lesson = await db.query.contentResource.findFirst({
		where: eq(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
			lessonSlug,
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
		columns: {
			id: true,
			fields: true,
		},
	})

	if (!lesson) {
		return notFound()
	}

	// Get the main resource (lesson or solution)
	let mainResource: ContentResource | null = null
	let muxPlaybackId: string | null = null
	let thumbnailUrl: string | undefined

	if (resourceType === 'solution') {
		// Get solution for this lesson
		const solution = await getSolutionForLesson(lesson.id)
		if (!solution) {
			return notFound()
		}
		mainResource = solution

		// Get video resource for solution
		const solutionVideoResource = await getVideoResourceForSolution(solution.id)
		if (solutionVideoResource?.muxPlaybackId) {
			muxPlaybackId = solutionVideoResource.muxPlaybackId
			if (solutionVideoResource.id) {
				thumbnailUrl = `${env.NEXT_PUBLIC_URL}/api/thumbnails?videoResourceId=${solutionVideoResource.id}&time=${solution.fields?.thumbnailTime || 0}`
			}
		}
	} else {
		// Handle lesson video
		const { ability } = await getServerAuthSession()
		mainResource = await getLesson(lessonSlug, ability)

		if (mainResource) {
			const playbackId = await getLessonMuxPlaybackId(mainResource.id)
			muxPlaybackId = playbackId || null
			const videoResource = lesson?.resources?.find(({ resource }) => {
				return resource.type === 'videoResource'
			})
			if (videoResource?.resourceId) {
				thumbnailUrl = `${env.NEXT_PUBLIC_URL}/api/thumbnails?videoResourceId=${videoResource.resourceId}&time=${lesson.fields?.thumbnailTime || 0}`
			}
		}
	}

	// Use standard session authentication (cookies work with iframe due to sameSite: 'none')
	const { session } = await getServerAuthSession()
	const user = session?.user || null

	// Use the same ability checking as the main app
	const abilityForResource = await getAbilityForResource(lessonSlug, moduleSlug)

	// Get workshop product for purchase deadline information
	const workshopProduct = await getWorkshopProduct(moduleSlug)

	// Get workshop resource for startsAt information
	const workshopResource = await getCachedMinimalWorkshop(moduleSlug)

	// Get cohort resource if this workshop is part of a cohort
	const cohortResource = await getWorkshopCohort(moduleSlug)

	// Check if workshop hasn't started yet (for authenticated users, unless they're an admin)
	const startsAt = workshopResource?.fields?.startsAt
	if (user && startsAt && !abilityForResource.canCreate) {
		// Properly handle timezone comparison - get current time in workshop timezone to compare with stored date
		const timezone = workshopResource?.fields?.timezone || 'America/Los_Angeles'
		const nowInTZ = new Date(
			formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
		)
		const startsAtDate = new Date(startsAt)

		if (startsAtDate > nowInTZ) {
			await log.info('embed_video_workshop_not_opened_yet', {
				lessonSlug,
				moduleSlug,
				resourceType,
				userId: user.id,
				workshopStartsAt: startsAt,
			})

			return (
				<EmbedContainer
					lessonSlug={lessonSlug}
					moduleSlug={moduleSlug}
					isAuthenticated={!!user}
				>
					<LoginPrompt
						lessonSlug={lessonSlug}
						moduleSlug={moduleSlug}
						workshopProduct={workshopProduct}
						workshopResource={workshopResource}
						cohortResource={cohortResource}
						hasAccess={true}
						isAdmin={abilityForResource.canCreate}
					/>
					{thumbnailUrl && (
						<Image
							fill
							className="blur-xs pointer-events-none absolute inset-0 z-0 h-full w-full select-none bg-cover opacity-20"
							src={thumbnailUrl}
							alt="thumbnail"
						/>
					)}
				</EmbedContainer>
			)
		}
	}

	// Check permissions for actual content access
	if (!user || !abilityForResource.canViewLesson) {
		await log.info('embed_video_unauthorized_access', {
			lessonSlug,
			moduleSlug,
			resourceType,
		})

		return (
			<EmbedContainer
				lessonSlug={lessonSlug}
				moduleSlug={moduleSlug}
				isAuthenticated={!!user}
			>
				<LoginPrompt
					lessonSlug={lessonSlug}
					moduleSlug={moduleSlug}
					workshopProduct={workshopProduct}
					workshopResource={workshopResource}
					cohortResource={cohortResource}
					hasAccess={false}
					isAdmin={abilityForResource.canCreate}
				/>
				{thumbnailUrl && (
					<Image
						fill
						className="blur-xs pointer-events-none absolute inset-0 z-0 h-full w-full select-none bg-cover opacity-20"
						src={thumbnailUrl}
						alt="thumbnail"
					/>
				)}
			</EmbedContainer>
		)
	}

	// Validate resource and playback ID
	if (!mainResource) {
		await log.warn('embed_video_resource_not_found', {
			lessonSlug,
			moduleSlug,
			resourceType,
			userId: user.id,
		})
		return (
			<EmbedContainer
				lessonSlug={lessonSlug}
				moduleSlug={moduleSlug}
				isAuthenticated={false}
			>
				<div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
					{resourceType === 'solution' ? 'Solution' : 'Lesson'} Not Found
				</div>
			</EmbedContainer>
		)
	}

	if (!muxPlaybackId) {
		await log.warn('embed_video_no_playback_id', {
			resourceId: mainResource.id,
			lessonSlug,
			resourceType,
			userId: user.id,
		})

		return (
			<EmbedContainer
				lessonSlug={lessonSlug}
				moduleSlug={moduleSlug}
				isAuthenticated={false}
			>
				<div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
					Video not found
				</div>
			</EmbedContainer>
		)
	}

	await log.info('embed_video_access_granted', {
		resourceId: mainResource.id,
		lessonSlug,
		moduleSlug,
		resourceType,
		userId: user.id,
	})

	const moduleProgressLoader = getModuleProgressForUser(moduleSlug)

	return (
		<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
			<EmbedContainer
				lessonSlug={lessonSlug}
				moduleSlug={moduleSlug}
				isAuthenticated={!!user}
			>
				<EmbedVideoPlayer
					resource={mainResource}
					muxPlaybackId={muxPlaybackId}
					moduleSlug={moduleSlug}
					user={user}
					thumbnailUrl={thumbnailUrl}
				/>
			</EmbedContainer>
		</ModuleProgressProvider>
	)
}
