'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { revalidateTutorialLesson } from '@/app/(content)/tutorials/actions'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { CldImage } from '@/components/cld-image'
import Spinner from '@/components/spinner'
import { VideoBlockNewsletterCta } from '@/components/video-block-newsletter-cta'
import { setProgressForResource } from '@/lib/progress'
import { MinimalWorkshop } from '@/lib/workshops'
import type { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { getAdjacentWorkshopResources } from '@/utils/get-adjacent-workshop-resources'
import type { AbilityForResource } from '@/utils/get-current-ability-rules'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { QueryStatus } from '@tanstack/react-query'
import { formatInTimeZone } from 'date-fns-tz'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import pluralize from 'pluralize'
import { useReward } from 'react-rewards'

import InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import { buildStripeCheckoutPath } from '@coursebuilder/core/pricing/build-stripe-checkout-path'
import type {
	ContentResource,
	ContentResourceResource,
	Product,
	Purchase,
} from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'
import { Button, Progress, useToast } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import type { CompletedAction } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { revalidateModuleLesson } from '../actions'
import { CopyProblemPromptButton } from '../workshops/_components/copy-problem-prompt-button'
import { VideoOverlayWorkshopPricing } from '../workshops/_components/video-overlay-pricing-widget'
import type { WorkshopPageProps } from '../workshops/_components/workshop-page-props'
import { handleSetLessonComplete } from './authed-video-player'
import { useModuleProgress } from './module-progress-provider'

export const CompletedLessonOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleType?: 'workshop' | 'tutorial'
	moduleSlug?: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}> = ({
	action,
	resource,
	moduleType = 'tutorial',
	moduleSlug,
	abilityLoader,
}) => {
	const { playerRef } = action
	const workshopNavigation = useWorkshopNavigation()
	const {
		nextResource: nextLesson,
		prevResource: prevLesson,
		isSolutionNext,
	} = getAdjacentWorkshopResources(workshopNavigation, resource?.id as string)

	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const { moduleProgress } = useModuleProgress()
	const { data: session } = useSession()

	const percentCompleted = moduleProgress?.percentCompleted || 0

	return nextLesson ? (
		<div
			aria-live="polite"
			className="bg-background/80 absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-lg text-white backdrop-blur-md sm:gap-5 lg:gap-10"
		>
			<div className="flex flex-col items-center text-center">
				<p className="pb-2 text-sm opacity-80 sm:text-base">
					{isSolutionNext
						? `Now Watch ${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME || 'Instructor'}'s Solution`
						: 'Up Next:'}
				</p>
				<p className="font-heading text-xl font-bold sm:text-2xl">
					{nextLesson?.type === 'solution'
						? getAdjacentWorkshopResources(workshopNavigation, nextLesson.id)
								?.prevResource?.fields?.title || 'Next Resource'
						: nextLesson?.fields?.title || 'Next Resource'}
				</p>
				{session?.user ? (
					<div className="mt-3 flex items-center gap-3 text-sm sm:mt-8">
						<Progress
							value={percentCompleted}
							className="bg-foreground/20 h-1 w-[150px] sm:w-[200px]"
						/>
						<div className="opacity-85">
							{moduleProgress?.completedLessonsCount || 0}/
							{moduleProgress?.totalLessonsCount || 0} completed
						</div>
					</div>
				) : (
					<div className="mt-3 text-sm sm:mt-8">
						<Link
							href="/login"
							className="dark:text-primary text-blue-600 hover:underline"
						>
							Log in
						</Link>{' '}
						to track your progress.
					</div>
				)}
			</div>
			<div className="flex w-full items-center justify-center gap-3">
				<Button
					variant="ghost"
					type="button"
					onClick={() => {
						if (playerRef.current) {
							playerRef.current.play()
						}
					}}
				>
					Replay
				</Button>
				{resource && resource.type !== 'solution' && (
					<CopyProblemPromptButton
						abilityLoader={abilityLoader}
						className="dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary h-10 bg-white/20 px-4 text-sm text-white transition hover:bg-white/30"
						lesson={resource}
						variant="default"
					/>
				)}
				{resource && (
					<ContinueButton
						className="h-10"
						moduleType={moduleType}
						resource={resource}
						nextResource={nextLesson}
						prevResource={prevLesson}
					/>
				)}
			</div>
			<Button
				type="button"
				className="absolute right-3 top-3 h-8 w-8 bg-white/10 sm:right-5 sm:top-5 sm:h-10 sm:w-10"
				variant="ghost"
				size="icon"
				onClick={() => {
					dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
				}}
			>
				<span className="sr-only">Dismiss</span>
				<XMarkIcon aria-hidden="true" className="h-4 w-4 sm:h-6 sm:w-6" />
			</Button>
		</div>
	) : (
		<CompletedModuleOverlay
			action={action}
			resource={resource}
			moduleType={moduleType}
			moduleSlug={moduleSlug}
			prevResource={prevLesson}
		/>
	)
}

export const CompletedModuleOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleType?: 'workshop' | 'tutorial'
	moduleSlug?: string
	prevResource?: any
}> = ({
	action,
	resource,
	moduleType = 'tutorial',
	moduleSlug,
	prevResource,
}) => {
	const { playerRef } = action
	const session = useSession()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const moduleNavigation = useWorkshopNavigation()
	const { moduleProgress, addLessonProgress } = useModuleProgress()
	const [isPending, startTransition] = React.useTransition()
	const isCurrentLessonCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.resourceId === resource?.id && p.completedAt,
		),
	)
	const { reward, isAnimating } = useReward('rewardId', 'confetti', {
		angle: 90,
		decay: 0.9,
		spread: 100,
	})

	React.useEffect(() => {
		if (!resource) return
		reward()
		if (isCurrentLessonCompleted) return
		startTransition(async () => {
			const resourceToComplete =
				resource.type === 'solution' && prevResource ? prevResource : resource
			await handleSetLessonComplete({
				currentResource: resourceToComplete,
				moduleProgress: moduleProgress,
				addLessonProgress: addLessonProgress,
			})
			if (moduleSlug && moduleType) {
				await revalidateModuleLesson(
					moduleSlug,
					resourceToComplete.fields?.slug as string,
					moduleType,
					resourceToComplete.type as 'lesson' | 'exercise' | 'solution',
				)
			}
		})
	}, []) // Empty deps array to only run once on mount

	const cohort = moduleNavigation?.parents?.[0]

	const currentWorkshopIndexInCohort =
		cohort?.resources?.findIndex(
			(workshop) => workshop.resource.id === moduleNavigation?.id,
		) || 0
	const nextWorkshop =
		cohort?.resources?.[currentWorkshopIndexInCohort + 1]?.resource

	return (
		<div
			aria-live="polite"
			className="absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-2 bg-gray-900/80 p-5 text-lg text-white backdrop-blur-md sm:gap-5 xl:gap-5"
		>
			<p className="font-heading text-center text-xl font-bold">Great job!</p>
			<p className="text-center text-sm sm:text-base">
				You&apos;ve completed the "{moduleNavigation?.fields?.title}"{' '}
				{moduleType}.
			</p>
			<span id="rewardId" />
			<div className="flex w-full items-center justify-center gap-3">
				<Button
					className="rounded-md border border-white/20 bg-white/10 hover:bg-white/20"
					variant="outline"
					type="button"
					onClick={() => {
						if (playerRef.current) {
							playerRef.current.play()
						}
					}}
				>
					Replay
				</Button>
				{nextWorkshop && (
					<Button asChild variant="default">
						<Link href={`/workshops/${nextWorkshop?.fields?.slug}`}>
							Continue{' '}
							<span className="hidden pl-1 sm:inline">
								to {nextWorkshop?.fields?.title}
							</span>
						</Link>
					</Button>
				)}
			</div>
			<Button
				type="button"
				className="text-foreground absolute right-5 top-5"
				variant="outline"
				size="icon"
				onClick={() => {
					dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
				}}
			>
				<span className="sr-only">Dismiss</span>
				<XMarkIcon aria-hidden="true" className="h-4 w-4" />
			</Button>
		</div>
	)
}

const ContinueButton: React.FC<{
	resource: ContentResource
	moduleType: 'workshop' | 'tutorial'
	nextResource?: ContentResource
	prevResource?: ContentResource | null
	className?: string
}> = ({
	resource,
	nextResource,
	prevResource = null,
	moduleType,
	className,
}) => {
	const router = useRouter()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const pathname = usePathname()
	const { moduleProgress, addLessonProgress } = useModuleProgress()
	const moduleNavigation = useWorkshopNavigation()
	const isCurrentLessonCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.resourceId === resource.id && p.completedAt,
		),
	)

	const isProblemLesson = Boolean(
		resource?.resources?.find((r) => r.resource.type === 'solution'),
	)

	const isSolution = pathname.endsWith('/solution')

	const [isPending, startTransition] = React.useTransition()
	const { data: session } = useSession()

	return (
		<Button
			className={cn(
				'dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground cursor-pointer bg-white text-black hover:bg-white/80',
				className,
			)}
			onClick={async () => {
				if (!isCurrentLessonCompleted && !isProblemLesson) {
					startTransition(async () => {
						// when on solution, we want to add progress to the previous lesson (problem)
						const resourceIdToComplete =
							isSolution && prevResource ? prevResource.id : resource.id
						const resourceToComplete =
							isSolution && prevResource ? prevResource : resource
						addLessonProgress(resourceIdToComplete)
						await setProgressForResource({
							resourceId: resourceIdToComplete,
							isCompleted: true,
						})
						if (
							moduleNavigation?.fields?.slug &&
							resourceToComplete?.fields?.slug
						) {
							await revalidateModuleLesson(
								moduleNavigation.fields.slug,
								resourceToComplete.fields.slug,
								moduleType,
								resourceToComplete.type as 'lesson' | 'exercise' | 'solution',
							)
						}
					})
					dispatchVideoPlayerOverlay({ type: 'LOADING' })
				}
				if (nextResource && moduleNavigation) {
					if (nextResource.type === 'solution') {
						return router.push(
							`/${pluralize(moduleType)}/${moduleNavigation.fields?.slug}/${resource?.fields?.slug}/solution`,
						)
					}
					return router.push(
						`/${pluralize(moduleType)}/${moduleNavigation.fields?.slug}/${nextResource?.fields?.slug}`,
					)
				}
			}}
			type="submit"
			disabled={isPending}
		>
			{(isCurrentLessonCompleted && !isPending) || !session?.user
				? 'Continue'
				: isProblemLesson
					? 'Continue'
					: 'Complete & Continue'}
			{isPending ? (
				<Spinner className="ml-2 size-4" />
			) : (
				<ArrowRight className="ml-2 size-4" />
			)}
		</Button>
	)
}

export const SoftBlockOverlay: React.FC<{
	resource: ContentResource | null
}> = ({ resource }) => {
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const { toast } = useToast()

	const moduleNavigation = useWorkshopNavigation()

	return (
		<div
			aria-live="polite"
			className="z-40 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden p-5 py-16 text-lg sm:p-10 sm:py-10 lg:p-16"
		>
			<VideoBlockNewsletterCta
				moduleTitle={moduleNavigation?.fields?.title}
				onSuccess={async (subscriber?: Subscriber) => {
					if (subscriber && moduleNavigation && resource) {
						await revalidateTutorialLesson(
							moduleNavigation.fields?.slug,
							resource?.fields?.slug,
						)
						dispatchVideoPlayerOverlay({ type: 'LOADING' })
						toast({
							title: 'Check your email',
						})
					}
				}}
			>
				{moduleNavigation?.fields?.coverImage && (
					<CldImage
						// className="flex sm:hidden"
						src={moduleNavigation.fields.coverImage}
						alt={moduleNavigation.fields.title}
						width={150}
						height={150}
					/>
				)}
			</VideoBlockNewsletterCta>
		</div>
	)
}

type VideoPlayerOverlayProps = {
	resource: ContentResource
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	pricingProps?: WorkshopPageProps
	moduleType?: 'workshop' | 'tutorial'
	moduleSlug?: string
	workshop: MinimalWorkshop | null
}

const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({
	resource,
	abilityLoader,
	pricingProps,
	moduleType = 'tutorial',
	moduleSlug,
	workshop,
}) => {
	// usePrefetchNextResource({ resource, moduleType, moduleSlug })

	const ability = use(abilityLoader)
	const canView = ability.canViewLesson
	const canInviteTeam = ability.canInviteTeam
	const isRegionRestricted = ability.isRegionRestricted

	const { state: overlayState, dispatch } = useVideoPlayerOverlay()
	const { data: session } = useSession()

	const purchaseForProduct = pricingProps?.purchases?.find(
		(purchase) => purchase.productId === pricingProps?.product?.id,
	)

	const showRegionRestrictedBlock =
		isRegionRestricted && !canView && purchaseForProduct

	const showTeamInvite =
		canInviteTeam && !canView && purchaseForProduct?.bulkCoupon

	const { data: formattedPrice, status: formattedPriceStatus } =
		api.pricing.formatted.useQuery(
			{
				productId: pricingProps?.product?.id,
				quantity: 1,
				upgradeFromPurchaseId: purchaseForProduct?.id,
				autoApplyPPP: false,
			},
			{
				enabled: Boolean(showRegionRestrictedBlock),
			},
		)

	if (showRegionRestrictedBlock) {
		const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
		const countryCode = purchaseForProduct.country
		const country = countryCode
			? regionNames.of(countryCode)
			: 'a specific region'

		return (
			<div
				aria-live="polite"
				className="relative z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-5 bg-gray-100 p-5 sm:text-lg"
			>
				<p className="max-w-md text-balance text-center">
					Your've purchased a regional license restricted to {country} for lower
					price. You can upgrade to get full access from anywhere in the world.
				</p>
				<Upgrade
					formattedPrice={formattedPrice}
					formattedPriceStatus={formattedPriceStatus}
					product={pricingProps?.product}
					purchase={purchaseForProduct}
					purchaseToUpgrade={formattedPrice?.upgradeFromPurchaseId}
					userId={session?.user?.id}
				/>
			</div>
		)
	}
	if (showTeamInvite) {
		const redemptionsLeft =
			purchaseForProduct?.bulkCoupon &&
			purchaseForProduct.bulkCoupon.maxUses >
				purchaseForProduct.bulkCoupon.usedCount

		return (
			<div
				aria-live="polite"
				className="bg-background relative z-40 flex h-full w-full flex-col items-center justify-center p-5 sm:aspect-video sm:text-lg"
			>
				<div className="mx-auto flex w-full max-w-lg flex-col gap-5">
					<p className="border-border w-full border-b pb-5 font-semibold">
						You've purchased a team license. Invite your team or claim a seat
						for yourself.
					</p>
					<InviteTeam
						className="flex flex-col items-start gap-2"
						purchase={purchaseForProduct}
						disabled={!redemptionsLeft}
						userEmail={session?.user.email}
					/>
				</div>
			</div>
		)
	}
	if (!canView && !ability.isPendingOpenAccess && moduleSlug) {
		if (moduleType === 'tutorial') {
			return <SoftBlockOverlay resource={resource} />
		}
		return (
			<div
				aria-live="polite"
				className={cn(
					'relative z-40 flex h-full w-full flex-col items-center justify-center p-5 py-8 text-lg xl:aspect-video',
					{
						'xl:aspect-auto': pricingProps?.country !== 'US',
					},
				)}
			>
				{pricingProps && <VideoOverlayWorkshopPricing {...pricingProps} />}
			</div>
		)
	}

	if (!canView && ability.isPendingOpenAccess && moduleSlug) {
		return (
			<div
				aria-live="polite"
				className={cn(
					'relative z-40 flex h-full w-full flex-col items-center justify-center p-5 py-8 text-lg xl:aspect-video',
				)}
			>
				<p>
					This lesson is not available yet. Please check back on{' '}
					{formatInTimeZone(
						new Date(workshop?.fields?.startsAt || ''),
						'America/Los_Angeles',
						`MMM d, yyyy 'at' h:mm a z`,
					)}
				</p>
			</div>
		)
	}

	switch (overlayState.action?.type) {
		case 'COMPLETED':
			return (
				<CompletedLessonOverlay
					action={overlayState.action}
					resource={resource}
					moduleType={moduleType}
					moduleSlug={moduleSlug}
					abilityLoader={abilityLoader}
				/>
			)
		case 'LOADING':
			return (
				<div
					aria-live="polite"
					className="text-foreground absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg"
				>
					<Spinner className="text-white" />
				</div>
			)
		case 'HIDDEN':
			return null
		default:
			return null
	}
}

export default VideoPlayerOverlay

const Upgrade: React.FC<{
	formattedPrice?: FormattedPrice
	formattedPriceStatus: QueryStatus
	purchase: Purchase
	product?: Product
	userId: string | undefined
	purchaseToUpgrade: any
}> = ({ formattedPrice, formattedPriceStatus, userId }) => {
	const pathname = usePathname()
	const formActionPath = buildStripeCheckoutPath({
		userId,
		quantity: formattedPrice?.quantity,
		productId: formattedPrice?.id,
		bulk: Boolean(formattedPrice?.bulk),
		upgradeFromPurchaseId: formattedPrice?.upgradeFromPurchaseId,
		cancelUrl: `${process.env.NEXT_PUBLIC_URL}${pathname}`,
	})

	return (
		<form
			action={formActionPath}
			method="POST"
			className="flex flex-col items-center gap-4"
		>
			{formattedPriceStatus !== 'success' ? (
				'Loading price...'
			) : (
				<div className="text-xl">
					<sup>US</sup>
					<span className="text-3xl font-bold">
						{formatUsd(formattedPrice?.calculatedPrice).dollars}
					</span>
					<sup>{formatUsd(formattedPrice?.calculatedPrice).cents}</sup>
				</div>
			)}
			<Button disabled={formattedPriceStatus !== 'success'} type="submit">
				Upgrade to full license
			</Button>
		</form>
	)
}
