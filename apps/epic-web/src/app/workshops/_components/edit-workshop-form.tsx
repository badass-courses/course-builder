'use client'

import { withResourceForm } from '@/components/resource-form/with-resource-form'
import type { Workshop } from '@/lib/workshops'

import { WorkshopFormBase } from './workshop-form-base'
import { workshopFormConfig } from './workshop-form-config'

/**
 * Wrapped workshop form component - created at module scope for stable identity
 */
const WorkshopForm = withResourceForm(WorkshopFormBase, {
	...workshopFormConfig,
	onSave: async (resource, hasNewSlug) => {
		if (hasNewSlug) {
			window.location.assign(`/workshops/${resource.fields?.slug}/edit`)
		}
	},
})

export type EditWorkshopFormProps = {
	workshop: Workshop
}

/**
 * Enhanced workshop form with common resource form functionality.
 */
export function EditWorkshopForm({ workshop }: EditWorkshopFormProps) {
	return <WorkshopForm resource={workshop} />
}
