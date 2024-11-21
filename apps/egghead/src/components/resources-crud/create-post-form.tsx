'use client'

import * as React from 'react'
import { NewPost, PostTypeSchema } from '@/lib/posts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'

export function CreatePostForm({
	resourceType,
	onCreate,
	createPost,
	restrictToPostType,
	onCancel,
}: {
	resourceType: string
	onCreate: (resource: ContentResource) => Promise<void>
	createPost: (values: NewPost) => Promise<ContentResource | null>
	restrictToPostType?: string
	onCancel?: () => void
}) {
	const form = useForm<{ fields: { title: string; postType: string } }>({
		resolver: zodResolver(
			z.object({
				fields: z.object({
					title: z.string(),
					postType: PostTypeSchema,
				}),
			}),
		),
		defaultValues: {
			fields: {
				title: '',
				postType: restrictToPostType || 'lesson',
			},
		},
	})

	const internalOnSubmit = async (values: {
		fields: { title: string; postType: string }
	}) => {
		const resource = await createPost({
			title: values.fields.title,
			postType: PostTypeSchema.parse(values.fields.postType),
		})
		form.reset()
		if (resource) {
			await onCreate(resource)
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(internalOnSubmit)}>
				<div className="flex flex-col gap-4">
					<FormField
						control={form.control}
						name="fields.title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormDescription>
									A title should summarize the {resourceType} and explain what
									it is about clearly.
								</FormDescription>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{!restrictToPostType && (
						<FormField
							control={form.control}
							name="fields.postType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Post Type</FormLabel>
									<FormDescription>
										Select the type of content you are creating
									</FormDescription>
									<FormControl>
										<select
											{...field}
											className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<option value="lesson">Lesson</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>
				<div className="mt-4 flex gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					)}
					<Button
						type="submit"
						variant="default"
						disabled={
							(form.formState.isDirty && !form.formState.isValid) ||
							form.formState.isSubmitting
						}
					>
						{form.formState.isSubmitting
							? 'Creating...'
							: `Create Draft ${resourceType}`}
					</Button>
				</div>
			</form>
		</Form>
	)
}
