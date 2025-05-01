'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { ResourceFormProps } from '@/components/resource-form/with-resource-form'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { ImagePlusIcon } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
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

import { WorkshopResourceType, WorkshopSchema } from './workshop-form-config'

/**
 * Base form component for workshop editing
 * Contains only workshop-specific form fields
 *
 * @param props - Component props from withResourceForm HOC
 */
export function WorkshopFormBase(
	props: ResourceFormProps<WorkshopResourceType, typeof WorkshopSchema>,
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
						<FormLabel className="text-lg font-bold">Title</FormLabel>
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
						<FormLabel className="text-lg font-bold">Slug</FormLabel>
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
						<FormLabel className="text-lg font-bold">Description</FormLabel>
						<Textarea {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.description"
			/>
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub</FormLabel>
						<Input {...field} value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
				name="fields.github"
			/>
			<div className="px-5">
				<FormLabel className="text-lg font-bold">Cover Image</FormLabel>
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
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues() as any)}
			/>
		</>
	)
}
