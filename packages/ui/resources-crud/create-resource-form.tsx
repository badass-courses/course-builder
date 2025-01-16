'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Button } from '../primitives/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../primitives/form'
import { Input } from '../primitives/input'

const NewResourceSchema = z.object({
	type: z.string(),
	title: z.string().min(2).max(90),
})

export type NewResource = z.infer<typeof NewResourceSchema>

export function CreateResourceForm({
	resourceType,
	onCreate,
	createResource,
}: {
	resourceType: string
	onCreate: (resource: ContentResource) => Promise<void>
	createResource: (values: NewResource) => Promise<ContentResource | null>
}) {
	const form = useForm<{ fields: { title: string } }>({
		resolver: zodResolver(
			z.object({ fields: z.object({ title: z.string() }) }),
		),
		defaultValues: {
			fields: {
				title: '',
			},
		},
	})

	const internalOnSubmit = async (values: { fields: { title: string } }) => {
		const resource = await createResource({
			title: values.fields.title,
			type: resourceType,
		})
		form.reset()
		if (resource) {
			await onCreate(resource)
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(internalOnSubmit)}>
				<FormField
					control={form.control}
					name="fields.title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormDescription>
								A title should summarize the {resourceType} and explain what it
								is about clearly.
							</FormDescription>
							<FormControl>
								<Input className="dark:text-white" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					className="mt-4 capitalize"
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
			</form>
		</Form>
	)
}
