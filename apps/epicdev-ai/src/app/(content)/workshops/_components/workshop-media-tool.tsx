'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { useResource } from '@/components/resource-form/resource-context'
import type { Workshop } from '@/lib/workshops'

/**
 * Workshop Media Tool component that uses the ResourceContext
 * This allows the media uploader to access the current workshop resource
 * being edited without requiring direct prop passing or HOC injection.
 */
export function WorkshopMediaTool() {
	const { resource } = useResource<Workshop>()

	// Add null check to prevent errors if resource is unavailable
	if (!resource) {
		return <div className="p-5">No workshop found.</div>
	}

	return (
		<div className="p-5">
			<ImageResourceUploader
				belongsToResourceId={resource.id}
				uploadDirectory="workshops"
			/>
		</div>
	)
}
