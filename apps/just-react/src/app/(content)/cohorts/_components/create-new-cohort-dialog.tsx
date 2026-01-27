'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createCohortWithWorkshops } from '@/lib/cohorts-query'
import { getAllWorkshopsMinimal } from '@/lib/workshops-query'
import { api } from '@/trpc/react'
import { Plus } from 'lucide-react'
import { z } from 'zod'

import {
	Button,
	CreateCohortForm,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import type { CohortCreationResult } from '@coursebuilder/ui/cohort-creation/create-cohort-form'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Dialog component for creating cohorts with workshops
 *
 * @example
 * ```tsx
 * <CreateNewCohortDialog
 *   buttonLabel="Create Cohort"
 *   className="w-full"
 * />
 * ```
 */
export default function CreateNewCohortDialog({
	buttonLabel = 'Create new cohort',
	variant = 'default',
	isOpen = false,
	className,
	modal = false,
}: {
	buttonLabel?: string | React.ReactNode
	className?: string
	variant?: ButtonProps['variant']
	isOpen?: boolean
	modal?: boolean
}) {
	const [open, setOpen] = React.useState(isOpen)
	const [workshops, setWorkshops] = React.useState<
		{ id: string; label: string; slug?: string }[]
	>([])
	const router = useRouter()
	const { data: tags } = api.tags.getTags.useQuery()
	const parsedTags = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags || [])

	React.useEffect(() => {
		// Fetch workshops on mount
		getAllWorkshopsMinimal().then((workshopList) => {
			setWorkshops(
				workshopList.map((w) => ({
					id: w.id,
					label: w.fields.title,
					slug: w.fields.slug,
				})),
			)
		})
	}, [])

	const handleSuccess = async (result: CohortCreationResult) => {
		if (result.cohort) {
			router.push(
				getResourcePath('cohort', result.cohort.fields?.slug || '', 'edit'),
			)
		}
	}

	return (
		<div>
			<Dialog
				modal={modal}
				onOpenChange={(isOpen) => {
					setOpen(isOpen)
				}}
				open={open}
			>
				<DialogTrigger asChild>
					<Button size="lg" className={cn(className)} variant={variant}>
						{buttonLabel}
						<Plus className="size-3 opacity-80" strokeWidth={3} />
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b pb-4">
						<DialogTitle className="text-xl font-semibold">
							Create Cohort
						</DialogTitle>
						<DialogDescription>
							Create a cohort-based course with a fixed start and end enrollment
							date. Optionally select workshops to include.
						</DialogDescription>
					</DialogHeader>
					<CreateCohortForm
						createCohort={createCohortWithWorkshops}
						onSuccess={handleSuccess}
						tags={parsedTags}
						workshops={workshops}
						defaultTimezone="America/Los_Angeles"
						defaultPrice={0}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
