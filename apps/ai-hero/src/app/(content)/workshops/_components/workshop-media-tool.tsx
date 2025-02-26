'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { useResource } from '@/components/resource-form/resource-context'

import { WorkshopResourceType } from './workshop-form-config'

/**
 * Workshop Media Tool component that uses the ResourceContext
 * This allows the media uploader to access the current workshop resource
 * being edited without requiring direct prop passing or HOC injection.
 */
export function WorkshopMediaTool() {
	const { resource } = useResource<WorkshopResourceType>()

	return (
		<div className="p-5">
			<ImageResourceUploader
				belongsToResourceId={resource.id}
				uploadDirectory="workshops"
			/>
		</div>
	)
}
