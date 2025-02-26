'use client'

import * as React from 'react'
import { useResource } from '@/components/resource-form/resource-context'
import WorkshopResourcesEdit from '@/components/resources-crud/workshop-resources-edit'

import { WorkshopResourceType } from './workshop-form-config'

/**
 * Workshop Resources Tool component that uses the ResourceContext
 * This allows the resources editor to access the current workshop resource
 * being edited without requiring direct prop passing or HOC injection.
 */
export function WorkshopResourcesTool() {
	const { resource } = useResource<WorkshopResourceType>()

	// Add null check to prevent errors if resource is unavailable
	if (!resource) {
		return <div className="p-5">No workshop found.</div>
	}

	return (
		<div className="h-[var(--pane-layout-height)] overflow-y-auto p-5">
			<WorkshopResourcesEdit workshop={resource} />
		</div>
	)
}
