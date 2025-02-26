'use client'

import * as React from 'react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { WithWorkshopForm } from './with-workshop-form'
import {
	isWorkshopResource,
	parseWorkshopResource,
	WorkshopResourceType,
} from './workshop-form-config'

/**
 * EditWorkshopForm component using the withResourceForm HOC
 * This is a thin wrapper around the WithWorkshopForm component
 *
 * @param props Workshop resource to edit
 */
export function EditWorkshopForm({ workshop }: { workshop: ContentResource }) {
	// Use type guard instead of type assertion for better type safety
	if (!isWorkshopResource(workshop)) {
		console.warn('Resource is not a workshop, but attempting to render as one')
		// Try to parse and validate the workshop schema
		const validatedWorkshop = parseWorkshopResource(workshop)
		return <WithWorkshopForm resource={validatedWorkshop} />
	}

	return <WithWorkshopForm resource={workshop} />
}
