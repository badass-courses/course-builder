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

import { TagField } from '../../posts/_components/tag-field'
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
			<TagField resource={resource} showEditButton />
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
			<FormField
				control={form.control}
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">
							Private GitHub Repo
						</FormLabel>
						<FormDescription className="mt-2 text-sm">
							For paywalled source code access. Format: owner/repo (e.g.
							code-with-antonio/my-private-repo)
						</FormDescription>
						<Input
							{...field}
							value={field.value || ''}
							placeholder="owner/repo"
						/>
						<FormMessage />
					</FormItem>
				)}
				name="fields.privateGithubRepo"
			/>
			<FormField
				control={form.control}
				name="fields.startsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Starts at</FormLabel>
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
						<FormLabel className="text-lg font-bold">Ends at</FormLabel>
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
						<FormLabel className="text-lg font-bold">Timezone</FormLabel>
						<Input {...field} readOnly disabled />
						<FormMessage />
					</FormItem>
				)}
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
			<EmailField workshop={resource as any} showEditButton={true} />
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues() as any)}
			/>
		</>
	)
}
