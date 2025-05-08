'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { revalidateTutorialLesson } from '@/app/(content)/tutorials/actions'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { CldImage } from '@/components/cld-image'
import Spinner from '@/components/spinner'
import { VideoBlockNewsletterCta } from '@/components/video-block-newsletter-cta'
import { usePrefetchNextResource } from '@/hooks/use-prefetch-next-resource'
import { addProgress, setProgressForResource } from '@/lib/progress'
import type { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import {
	getAdjacentWorkshopResources,
	type AdjacentResource,
} from '@/utils/get-adjacent-workshop-resources'
import type { AbilityForResource } from '@/utils/get-current-ability-rules'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { QueryStatus } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import pluralize from 'pluralize'

import InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import { buildStripeCheckoutPath } from '@coursebuilder/core/pricing/build-stripe-checkout-path'
import type {
	ContentResource,
	Product,
	Purchase,
} from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'
import { Button, Progress, useToast } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import type { CompletedAction } from '@coursebuilder/ui/hooks/use-video-player-overlay'

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
	abilityLoader: Promise<AbilityForResource>
}> = ({
	action,
	resource,
	moduleType = 'tutorial',
	moduleSlug,
	abilityLoader,
}) => {
	const { playerRef } = action
	const workshopNavigation = useWorkshopNavigation()
	const { nextResource: nextLesson, prevResource: prevLesson } =
		getAdjacentWorkshopResources(workshopNavigation, resource?.id as string)

	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const { moduleProgress } = useModuleProgress()

	const percentCompleted = moduleProgress?.percentCompleted || 0

	return nextLesson ? (
		<div
			aria-live="polite"
			className="absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 bg-gray-900/80 p-5 text-lg text-white backdrop-blur-md"
		>
			<div className="flex flex-col items-center text-center">
				<p className="pb-2 opacity-80">Up Next:</p>
				<p className="font-heading fluid-2xl font-bold">{nextLesson?.title}</p>
				<div className="mt-8 flex items-center gap-3 text-sm">
					<Progress
						value={percentCompleted}
						className="bg-background/20 h-1 w-[150px] sm:w-[200px]"
					/>
					{moduleProgress?.completedLessonsCount || 0}/
					{moduleProgress?.totalLessonsCount || 0} completed
				</div>
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
				{resource && (
					<CopyProblemPromptButton
						abilityLoader={abilityLoader}
						className="dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary h-10 bg-white/20 px-4 text-sm text-white transition hover:bg-white/30"
						lesson={resource}
						variant="default"
					/>
				)}
				{resource && (
					<ContinueButton
						moduleType={moduleType}
						resource={resource}
						nextResource={nextLesson}
						prevResource={prevLesson}
					/>
				)}
			</div>
			<Button
				type="button"
				className="absolute right-5 top-5 bg-white/10"
				variant="ghost"
				size="icon"
				onClick={() => {
					dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
				}}
			>
				<span className="sr-only">Dismiss</span>
				<XMarkIcon aria-hidden="true" className="h-6 w-6" />
			</Button>
		</div>
	) : (
		<CompletedModuleOverlay
			action={action}
			resource={resource}
			moduleType={moduleType}
		/>
	)
}

export const CompletedModuleOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleType?: 'workshop' | 'tutorial'
}> = ({ action, resource, moduleType = 'tutorial' }) => {
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
	React.useEffect(() => {
		if (!resource) return
		if (isCurrentLessonCompleted) return

		startTransition(() => {
			handleSetLessonComplete({
				currentResource: resource,
				moduleProgress: moduleProgress,
				addLessonProgress: addLessonProgress,
			})
		})
	}, []) // Empty deps array to only run once on mount

	const cohort = moduleNavigation?.cohorts?.[0]

	const currentWorkshopIndexInCohort =
		cohort?.resources?.findIndex(
			(workshop) => workshop.id === moduleNavigation?.id,
		) || 0
	const nextWorkshop = cohort?.resources[currentWorkshopIndexInCohort + 1]

	return (
		<div
			aria-live="polite"
			className="absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 bg-gray-900/80 p-5 text-lg text-white backdrop-blur-md"
		>
			<p className="font-heading fluid-xl pb-3 text-center font-bold">
				Great job!
			</p>
			<p className="fluid-base text-center">
				You&apos;ve completed the {moduleNavigation?.title} {moduleType}.
			</p>
			<div className="flex w-full items-center justify-center gap-3">
				<Button
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
						<Link href={`/workshops/${nextWorkshop?.slug}`}>
							Continue to {nextWorkshop?.title}
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
	nextResource?: AdjacentResource
	prevResource?: AdjacentResource
}> = ({ resource, nextResource, prevResource, moduleType }) => {
	const router = useRouter()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()

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

	const [isPending, startTransition] = React.useTransition()
	return (
		<Button
			className="dark:bg-primary dark:hover:bg-primary/80 dark:text-primary-foreground bg-white text-black hover:bg-white/80"
			onClick={async () => {
				if (!isCurrentLessonCompleted && !isProblemLesson && prevResource) {
					startTransition(async () => {
						// when on solution, we want to add progress to the previous lesson (problem)
						addLessonProgress(prevResource.id)
						await setProgressForResource({
							resourceId: prevResource.id,
							isCompleted: true,
						})
					})
					dispatchVideoPlayerOverlay({ type: 'LOADING' })
				}
				if (nextResource && moduleNavigation) {
					if (nextResource.type === 'solution') {
						return router.push(
							`/${pluralize(moduleType)}/${moduleNavigation.slug}/${resource?.fields?.slug}/solution`,
						)
					}
					return router.push(
						`/${pluralize(moduleType)}/${moduleNavigation.slug}/${nextResource?.slug}`,
					)
				}
			}}
			type="submit"
			disabled={isPending}
		>
			{isCurrentLessonCompleted && !isPending
				? 'Continue'
				: isProblemLesson
					? 'Continue'
					: 'Complete & Continue'}
			{isPending && <Spinner className="ml-2 h-4 w-4" />}
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
			className="bg-background/90 z-40 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden p-5 py-16 text-lg backdrop-blur-md sm:p-10 sm:py-10 lg:p-16"
		>
			<VideoBlockNewsletterCta
				moduleTitle={moduleNavigation?.title}
				onSuccess={async (subscriber?: Subscriber) => {
					if (subscriber && moduleNavigation && resource) {
						await revalidateTutorialLesson(
							moduleNavigation.slug,
							resource?.fields?.slug,
						)
						dispatchVideoPlayerOverlay({ type: 'LOADING' })
						toast({
							title: 'Check your email',
						})
					}
				}}
			>
				{moduleNavigation?.coverImage && (
					<CldImage
						// className="flex sm:hidden"
						src={moduleNavigation.coverImage}
						alt={moduleNavigation.title}
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
	abilityLoader: Promise<AbilityForResource>
	pricingProps?: WorkshopPageProps
	moduleType?: 'workshop' | 'tutorial'
	moduleSlug?: string
}

const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({
	resource,
	abilityLoader,
	pricingProps,
	moduleType = 'tutorial',
	moduleSlug,
}) => {
	// usePrefetchNextResource({ resource, moduleType, moduleSlug })

	const ability = use(abilityLoader)
	const canView = ability.canView
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
				className="relative z-40 flex h-full w-full flex-col items-center justify-center bg-gray-100 p-5 sm:aspect-video sm:text-lg"
			>
				<div className="mx-auto flex w-full max-w-lg flex-col gap-5">
					<p className="w-full border-b border-gray-300 pb-5 font-semibold">
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
	if (!canView && moduleSlug) {
		if (moduleType === 'tutorial') {
			return <SoftBlockOverlay resource={resource} />
		}
		return (
			<div
				aria-live="polite"
				className="bg-background relative z-40 flex h-full w-full flex-col items-center justify-center p-5 py-8 text-lg"
			>
				{pricingProps && <VideoOverlayWorkshopPricing {...pricingProps} />}
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
					className="text-foreground absolute left-0 top-0 z-40 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 bg-black/80 p-5 text-lg backdrop-blur-md"
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
