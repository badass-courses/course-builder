'use client'

import * as React from 'react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { WithWorkshopForm } from './with-workshop-form'
import { WorkshopResourceType } from './workshop-form-config'

/**
 * EditWorkshopForm component using the withResourceForm HOC
 * This is a thin wrapper around the WithWorkshopForm component
 *
 * @param props Workshop resource to edit
 */
export function EditWorkshopForm({ workshop }: { workshop: ContentResource }) {
	// Type cast workshop to WorkshopResourceType to satisfy TypeScript
	return (
		<WithWorkshopForm resource={workshop as unknown as WorkshopResourceType} />
	)
}
