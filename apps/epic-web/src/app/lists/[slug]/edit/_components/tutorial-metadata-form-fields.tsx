import * as React from 'react'
import { TagField } from '@/app/posts/_components/tag-field'
import type { Module, ModuleSchema } from '@/lib/module'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@coursebuilder/ui'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

/**
 * Metadata form fields for tutorials
 */
export const TutorialMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof ModuleSchema>>
	tutorial: Module
}> = ({ form, tutorial }) => {
	return (
		<>
			<FormField
				control={form.control}
				name="id"
				render={({ field }) => <Input type="hidden" {...field} />}
			/>
			<FormField
				control={form.control}
				name="fields.title"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Title</FormLabel>
						<FormDescription>
							A title should summarize the post and explain what it is about
							clearly.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.slug"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Slug</FormLabel>
						<FormDescription>Short with keywords is best.</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="type"
				render={({ field }) => {
					return (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Type</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value || 'tutorial'}
								disabled
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select type..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="tutorial">Tutorial</SelectItem>
									<SelectItem value="workshop">Workshop</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
			<TagField resource={tutorial as any} showEditButton />
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">
							SEO Description ({`${field.value?.length ?? '0'} / 160`})
						</FormLabel>
						<FormDescription>
							A short snippet that summarizes the post in under 160 characters.
							Keywords should be included to support SEO.
						</FormDescription>
						<Textarea {...field} value={field.value ?? ''} />
						{field.value && field.value.length > 160 && (
							<FormMessage>
								Your description is longer than 160 characters
							</FormMessage>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.coverImage"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Image URL</FormLabel>
						<Input
							{...field}
							value={field.value?.url || ''}
							onChange={(e) => {
								field.onChange({
									url: e.target.value,
									alt: field.value?.alt || '',
								})
							}}
							onDrop={(e) => {
								e.preventDefault()
								const result = e.dataTransfer.getData('text/plain')
								const parsedResult = result.match(/\(([^)]+)\)/)
								if (parsedResult) {
									field.onChange({
										url: parsedResult[1],
										alt: field.value?.alt || '',
									})
								}
							}}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<FormField
				control={form.control}
				name="fields.github"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub</FormLabel>
						<FormDescription>
							Direct link to the GitHub file associated with the post.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	)
}
