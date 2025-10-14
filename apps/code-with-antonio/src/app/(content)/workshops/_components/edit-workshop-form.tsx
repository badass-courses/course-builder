'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import type { Workshop, WorkshopRaw, WorkshopSchema } from '@/lib/workshops'

import { WorkshopFormBase } from './workshop-form-base'
import { workshopFormConfig } from './workshop-form-config'

export type EditWorkshopFormProps = {
	workshop: Workshop // Assuming WorkshopRaw is the correct type for the raw resource
	// Add other props if needed, similar to EditPostFormProps
}

/**
 * Enhanced workshop form with common resource form functionality.
 */
export function EditWorkshopForm({ workshop }: { workshop: Workshop }) {
	const router = useRouter()

	const WorkshopForm = withResourceForm<Workshop, typeof WorkshopSchema>(
		WorkshopFormBase, // The base component rendering the fields
		{
			...workshopFormConfig, // Spread the base config
			onSave: async (resource, hasNewSlug) => {
				if (hasNewSlug) {
					// Use the workshop slug and path
					router.push(`/workshops/${resource.fields?.slug}/edit`)
				}
			},
			// You might need to re-define or adjust customTools here if they were
			// dependent on props passed to EditWorkshopForm, though in this case
			// the tools defined in workshopFormConfig seem self-contained.
		},
	)

	// Type assertion might be needed if WorkshopRaw doesn't perfectly match ContentResource
	// Adjust as necessary based on your actual types.
	return <WorkshopForm resource={workshop as unknown as Workshop} />
}
