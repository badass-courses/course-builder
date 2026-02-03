'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createWorkshop } from '@/lib/workshops/workshops.service'
import { ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button, Input, Label } from '@coursebuilder/ui'

/**
 * Props for the CreateWorkshop component, allowing a custom onResourceCreated callback
 * that can bypass default navigation behavior.
 */
export interface CreateWorkshopProps {
	/**
	 * If provided, called instead of the default router.push to the resource's edit page.
	 */
	onResourceCreated?: (resource: ContentResource) => Promise<void>
	/**
	 * Whether to show the contributor selectable option
	 * @default false
	 */
	contributorSelectable?: boolean
}

interface WorkshopFormData {
	title: string
}

/**
 * Creates a new workshop resource. If a custom `onResourceCreated` is provided,
 * that callback is used instead of the default router navigation.
 */
export function CreateWorkshop({
	onResourceCreated,
	contributorSelectable = false,
}: CreateWorkshopProps = {}): JSX.Element {
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [resourceUrl, setResourceUrl] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<WorkshopFormData>()

	const onSubmit = async (data: WorkshopFormData) => {
		setIsSubmitting(true)
		setError(null)

		try {
			const workshop = await createWorkshop({
				title: data.title,
			})

			const editUrl = `/workshops/${workshop.fields?.slug || workshop.id}/edit`
			setResourceUrl(editUrl)

			// Notify parent components
			if (onResourceCreated) {
				await onResourceCreated(workshop as ContentResource)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create workshop')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title" className="font-heading font-semibold">
						Workshop Title
					</Label>
					<Input
						id="title"
						type="text"
						placeholder="Enter workshop title"
						{...register('title', { required: 'Title is required' })}
						disabled={isSubmitting}
					/>
					{errors.title && (
						<p className="text-sm text-red-500">{errors.title.message}</p>
					)}
				</div>

				{error && <p className="text-sm text-red-500">{error}</p>}

				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? 'Creating...' : 'Create Workshop'}
				</Button>
			</form>

			{resourceUrl && (
				<div className="flex items-center justify-center gap-2 pt-2">
					Resource created.{' '}
					<Link
						href={resourceUrl}
						target="_blank"
						className="inline-flex items-center underline"
					>
						Edit <ExternalLink className="ml-1 size-4" />
					</Link>
				</div>
			)}
		</>
	)
}
