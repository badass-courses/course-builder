'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { ResourceFormProps } from '@/components/resource-form/with-resource-form'
import { Workshop, WorkshopSchema } from '@/lib/workshops'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { parseAbsolute } from '@internationalized/date'
import { ImagePlusIcon } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	DateTimePicker,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { EmailField } from './email-field'

/**
 * Base form component for workshop editing
 * Contains only workshop-specific form fields
 *
 * @param props - Component props from withResourceForm HOC
 */
export function WorkshopFormBase(
	props: ResourceFormProps<ContentResource, typeof WorkshopSchema>,
) {
	const { resource, form } = props

	// If form is not available, don't render anything
	if (!form) return null

	return (
		<>
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-semibold">Title</FormLabel>
						<FormDescription className="mt-2 text-sm">
							A title should summarize the tip and explain what it is about
							clearly.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.title"
			/>
			<FormField
				control={form.control}
				name="fields.slug"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-semibold">Slug</FormLabel>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-semibold">Description</FormLabel>
						<Textarea {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.description"
			/>
			<FormField
				control={form.control}
				name="fields.startsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-semibold">Starts at</FormLabel>
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
						<FormLabel className="text-lg font-semibold">Ends at</FormLabel>
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
						<FormLabel className="text-lg font-semibold">Timezone</FormLabel>
						<Input {...field} readOnly disabled />
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="flex flex-col gap-2 px-5">
				<div>
					<h2 className="text-lg font-semibold">Workshop App Settings</h2>
					<p className="text-muted-foreground text-sm">
						These settings are used to configure the workshop app.
					</p>
				</div>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="">
							<FormLabel className="text-base font-semibold">
								External URL
							</FormLabel>
							<Input {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.workshopApp.externalUrl"
				/>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="">
							<FormLabel className="text-base font-semibold">Port</FormLabel>
							<Input {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.workshopApp.port"
				/>
			</div>
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-semibold">GitHub</FormLabel>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.github"
			/>
			<div className="px-5">
				<FormLabel className="text-lg font-semibold">Cover Image</FormLabel>
				{form.watch('fields.coverImage.url') && (
					<img src={form.watch('fields.coverImage.url')} alt="Cover" />
				)}
			</div>
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="">Cover Image URL</FormLabel>
						<Input
							{...field}
							onDrop={(e) => {
								const result = e.dataTransfer.getData('text/plain')
								// Use a more robust URL regex pattern to handle more formats
								const urlRegex = /(https?:\/\/[^\s"'<>()[\]{}]+)/
								const parsedResult = result.match(urlRegex)
								if (parsedResult) {
									field.onChange(parsedResult[1])
								}
							}}
							value={field.value || ''}
						/>
						<FormMessage />
					</FormItem>
				)}
				name="fields.coverImage.url"
			/>
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="">Cover Image alt</FormLabel>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.coverImage.alt"
			/>
			<EmailField workshop={resource as any} showEditButton={true} />
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues() as any)}
			/>
		</>
	)
}
