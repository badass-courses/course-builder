'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import type { Workshop } from '@/lib/workshops'

import { WorkshopFormBase } from './workshop-form-base'
import { workshopFormConfig } from './workshop-form-config'

export type EditWorkshopFormProps = {
	workshop: Workshop
}

/**
 * Enhanced workshop form with common resource form functionality.
 */
export function EditWorkshopForm({ workshop }: { workshop: Workshop }) {
	const router = useRouter()

	const WorkshopForm = withResourceForm(
		WorkshopFormBase, // The base component rendering the fields
		{
			...workshopFormConfig, // Spread the base config
			onSave: async (resource, hasNewSlug) => {
				if (hasNewSlug) {
					// Use the workshop slug and path
					router.push(`/workshops/${resource.fields?.slug}/edit`)
				}
			},
		},
	)

	return <WorkshopForm resource={workshop} />
}
