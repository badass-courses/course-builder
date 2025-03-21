'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getNextWorkshopResource } from '@/utils/get-next-workshop-resource'
import { getResourcePath } from '@/utils/resource-paths'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { useWorkshopNavigation } from './workshop-navigation-provider'

// Component just for prefetching the next resource
function PrefetchNextResource({
	nextResource,
	workshopSlug,
}: {
	nextResource: { type: string; slug: string } | null
	workshopSlug: string | null
}) {
	const router = useRouter()

	React.useEffect(() => {
		if (!nextResource || !workshopSlug) return

		router.prefetch(
			getResourcePath(nextResource.type, nextResource.slug, 'view', {
				parentType: 'workshop',
				parentSlug: workshopSlug,
			}),
		)
	}, [router, nextResource, workshopSlug])

	return null
}

export default function UpNext({
	currentResourceId,
	className,
}: {
	currentResourceId: string
	className?: string
}) {
	const navigation = useWorkshopNavigation()
	const { data: session } = useSession()
	if (!navigation) {
		return null
	}

	const nextResource = getNextWorkshopResource(navigation, currentResourceId)

	// If there's no next resource, don't render anything
	if (!nextResource) {
		return null
	}

	// For solution resources, we need to use the parent lesson's slug
	const nextResourceSlug = nextResource.slug

	return (
		<>
			<PrefetchNextResource
				nextResource={{
					type: nextResource.type,
					slug: nextResourceSlug,
				}}
				workshopSlug={navigation.slug}
			/>
			<nav
				className={cn(
					'bg-card mt-8 flex w-full flex-col items-center rounded border px-5 py-10 text-center',
					className,
				)}
				aria-label="Recommendations"
			>
				<h2 className="fluid-2xl mb-3 font-semibold">Up Next</h2>
				<ul className="w-full">
					<li className="flex w-full flex-col">
						<Link
							className="dark:text-primary flex w-full items-center justify-center gap-2 text-center text-lg text-orange-600 hover:underline lg:text-xl"
							href={getResourcePath(
								nextResource.type,
								nextResourceSlug,
								'view',
								{
									parentType: 'workshop',
									parentSlug: navigation.slug,
								},
							)}
							// onClick={async () => {
							// 	if (!isCompleted) {
							// 		addLessonProgress(postId)
							// 		await setProgressForResource({
							// 			resourceId: postId,
							// 			isCompleted: true,
							// 		})
							// 	}
							// }}
						>
							{nextResource.title}
							<ArrowRight className="hidden w-4 sm:block" />
						</Link>
						{!session?.user && (
							<span className="text-muted-foreground mt-4">
								<Link
									href="/login"
									target="_blank"
									className="hover:text-foreground text-center underline"
								>
									Log in
								</Link>{' '}
								to save progress
							</span>
						)}
					</li>
				</ul>
			</nav>
		</>
	)
}
