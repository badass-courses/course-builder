'use client'

import * as React from 'react'
import StandaloneVideoResourceUploaderAndViewer from '@/app/(content)/posts/_components/standalone-video-resource-uploader-and-viewer'
import { PageBlocks } from '@/app/admin/pages/_components/page-builder-mdx-components'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import {
	ResourceFormProps,
	withResourceForm,
} from '@/components/resource-form/with-resource-form'
import { Cohort, CohortSchema } from '@/lib/cohort'
import { parseAbsolute } from '@internationalized/date'
import { ImagePlusIcon, LayoutTemplate, VideoIcon } from 'lucide-react'
import { z } from 'zod'

import {
	DateTimePicker,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

import { cohortFormConfig } from './cohort-form-config'
import { OfficeHoursField } from './office-hours-field'

/**
 * Cohort form fields component
 */
function CohortFormFields({
	form,
	resource,
}: ResourceFormProps<Cohort, typeof CohortSchema>) {
	if (!form) return null

	return (
		<EditResourcesMetadataFields form={form}>
			<OfficeHoursField form={form} cohort={resource} />
			<div className="px-5">
				<FormLabel>Cover Image</FormLabel>
				{form.watch('fields.image') && <img src={form.watch('fields.image')} />}
			</div>
			<FormField
				control={form.control}
				name="fields.image"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Image URL</FormLabel>
						<Input
							{...field}
							onDrop={(e) => {
								const result = e.dataTransfer.getData('text/plain')
								const parsedResult = result.match(/\(([^)]+)\)/)
								if (parsedResult) {
									field.onChange(parsedResult[1])
								}
							}}
							value={field.value}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="fields.startsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Starts At:</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="fields.endsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Ends At:</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.timezone"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Timezone:</FormLabel>
						<Input {...field} readOnly disabled />
						<FormMessage />
					</FormItem>
				)}
			/>
		</EditResourcesMetadataFields>
	)
}

/**
 * Enhanced cohort form with common resource form functionality
 */
export const EditCohortForm = ({ resource }: { resource: Cohort }) => {
	const CohortForm = withResourceForm(CohortFormFields, {
		...cohortFormConfig,
		customTools: [
			{
				id: 'images',
				icon: () => (
					<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: (
					<ImageResourceUploader
						key={'image-uploader'}
						belongsToResourceId={resource.id}
						uploadDirectory={`cohorts`}
					/>
				),
			},
			{
				id: 'MDX Components',
				label: 'MDX Components',
				icon: () => (
					<LayoutTemplate strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: (
					<div className="mt-3 px-5">
						<h3 className="mb-3 inline-flex text-xl font-semibold">
							MDX Components
						</h3>
						<PageBlocks />
					</div>
				),
			},
			{
				id: 'videos',
				icon: () => (
					<VideoIcon strokeWidth={1.5} size={24} width={18} height={18} />
				),
				toolComponent: <StandaloneVideoResourceUploaderAndViewer />,
			},
		],
	})

	return <CohortForm resource={resource} />
}
