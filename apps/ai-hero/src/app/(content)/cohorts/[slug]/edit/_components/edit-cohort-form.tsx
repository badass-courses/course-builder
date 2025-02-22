'use client'

import * as React from 'react'
import { DateTimePicker } from '@/app/(content)/events/[slug]/edit/_components/date-time-picker/date-time-picker'
import {
	ResourceFormProps,
	withResourceForm,
} from '@/components/resource-form/with-resource-form'
import { Cohort, CohortSchema } from '@/lib/cohort'
import { parseAbsolute } from '@internationalized/date'
import { z } from 'zod'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

import { cohortFormConfig } from './cohort-form-config'

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
export const EditCohortForm = withResourceForm(
	CohortFormFields,
	cohortFormConfig,
)
