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

		try {
			// Try to parse and validate the workshop schema
			const validatedWorkshop = parseWorkshopResource(workshop)
			return <WithWorkshopForm resource={validatedWorkshop} />
		} catch (error) {
			console.error('Failed to parse workshop resource', error)
			return (
				<div className="p-5">
					Unable to load workshop resource. Invalid data format.
				</div>
			)
		}
	}

	return <WithWorkshopForm resource={workshop} />
}
