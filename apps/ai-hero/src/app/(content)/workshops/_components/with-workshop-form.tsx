'use client'

import * as React from 'react'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

import { WorkshopFormBase } from './workshop-form-base'
import {
	workshopFormConfig,
	WorkshopResourceType,
	WorkshopSchema,
} from './workshop-form-config'

/**
 * Higher-order component for the workshop form
 * Uses the withResourceForm HOC to add common resource form functionality
 *
 * @example
 * ```tsx
 * <WithWorkshopForm resource={workshop} />
 * ```
 */
export const WithWorkshopForm = withResourceForm<
	WorkshopResourceType,
	typeof WorkshopSchema
>(WorkshopFormBase, workshopFormConfig)
