import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Cohort, CohortSchema } from '@/lib/cohort'
import { updateResource } from '@/lib/resources-query'
import { ImagePlusIcon } from 'lucide-react'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

import { onCohortSave } from '../actions'

export const cohortFormConfig: ResourceFormConfig<Cohort, typeof CohortSchema> =
	{
		resourceType: 'cohort',
		schema: CohortSchema,
		defaultValues: (cohort) => {
			if (!cohort) {
				return {
					type: 'cohort',
					fields: {
						title: '',
						visibility: 'public',
						image: '',
						description: '',
						slug: '',
						timezone: 'America/Los_Angeles',
						state: 'draft',
					},
				} as Cohort
			}

			return {
				...cohort,
				fields: {
					title: cohort?.fields?.title || '',
					visibility: cohort?.fields?.visibility || 'public',
					image: cohort?.fields?.image || '',
					description: cohort?.fields?.description || '',
					slug: cohort?.fields?.slug || '',
					timezone: cohort?.fields?.timezone || 'America/Los_Angeles',
					startsAt: cohort?.fields?.startsAt
						? new Date(cohort.fields.startsAt).toISOString()
						: undefined,
					endsAt: cohort?.fields?.endsAt
						? new Date(cohort.fields.endsAt).toISOString()
						: undefined,
					state: cohort?.fields?.state || 'draft',
				},
			}
		},
		createPostConfig: {
			title: 'Create a Lesson',
			defaultResourceType: 'cohort-lesson',
			availableResourceTypes: ['cohort-lesson'],
		},
		getResourcePath: (slug?: string) =>
			slug ? `/cohorts/${slug}` : '/cohorts',
		updateResource: async (resource) => {
			if (!resource.id || !resource.fields) {
				throw new Error('Invalid resource data')
			}

			const result = await updateResource({
				id: resource.id,
				type: 'cohort',
				fields: resource.fields,
				createdById: resource.createdById || '',
			})

			if (!result) throw new Error('Failed to update cohort')
			return result as Cohort
		},
		onSave: onCohortSave,
	}
