import { Calendar, Edit3, Tag, Trash, User } from 'lucide-react'

/**
 * Skeleton component for post list loading state
 * Matches the structure of actual post list items with shimmer animation
 */
export function PostListSkeleton() {
	return (
		<div className="space-y-1">
			{Array.from({ length: 8 }).map((_, index) => (
				<div
					key={index}
					className="bg-background flex items-center justify-between rounded-lg border border-transparent px-3 py-2"
				>
					{/* Title skeleton on the left */}
					<div className="min-w-0 flex-1">
						<div className="h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
					</div>

					{/* Metadata skeleton on the right - hidden on mobile */}
					<div className="hidden items-center gap-3 md:flex">
						{/* State and Type skeleton */}
						<div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

						{/* Date skeleton */}
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-3 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>

						{/* Tag count skeleton */}
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
							<div className="h-3 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
						</div>

						{/* Author skeleton */}
						<div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
					</div>

					{/* Action buttons skeleton */}
					<div className="ml-2 flex items-center gap-1">
						<div className="h-7 w-7 animate-pulse rounded border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700" />
						<div className="h-7 w-7 animate-pulse rounded border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700" />
					</div>
				</div>
			))}
		</div>
	)
}

/**
 * Skeleton component for the create post section
 */
export function CreatePostSkeleton() {
	return (
		<div className="order-1 h-full max-w-lg flex-grow md:order-2">
			<div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
			<div className="space-y-4">
				<div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
			</div>
		</div>
	)
}

/**
 * Skeleton component for instructor name in post list
 */
export function InstructorSkeleton() {
	return (
		<div className="text-muted-foreground text-mono text-xs">
			<div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
		</div>
	)
}
