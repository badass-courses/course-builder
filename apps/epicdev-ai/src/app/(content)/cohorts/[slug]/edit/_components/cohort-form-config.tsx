import { ResourceFormConfig } from '@/components/resource-form/with-resource-form'
import { Cohort, CohortSchema } from '@/lib/cohort'
import { updateResource } from '@/lib/resources-query'

import { onCohortSave } from '../actions'
import SearchConfig from './cohort-list-editor-search-config'

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
					...cohort?.fields,
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
		createResourceConfig: {
			title: 'Add Content',
			availableTypes: [
				{ type: 'post', postTypes: ['article'] },
				{ type: 'workshop' },
				{ type: 'tutorial' },
				{ type: 'lesson' },
			],
			defaultType: { type: 'post', postType: 'article' },
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
		bodyPanelConfig: {
			showListResources: true,
			listEditorConfig: {
				title: (
					<div>
						<span className="flex text-lg font-bold">Workshops</span>
						<span className="text-muted-foreground mt-2 font-normal">
							Add and organize workshops in this cohort.
						</span>
					</div>
				),
				searchConfig: <SearchConfig />,
				showTierSelector: true,
			},
		},
	}
