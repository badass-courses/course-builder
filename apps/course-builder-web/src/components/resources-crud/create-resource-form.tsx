import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createResource } from '@/lib/resources/create-resources'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/types'
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

export function CreateResourceForm({
	resourceType,
	onCreate = async () => Promise.resolve(),
}: {
	resourceType: string
	onCreate?: (resource: ContentResource) => Promise<void>
}) {
	const router = useRouter()

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
			router.push(`/${resourceType}s/${resource.fields?.slug}/edit`)
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(internalOnSubmit)}
				className="space-y-8"
			>
				<FormField
					control={form.control}
					name="fields.title"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-lg font-bold">Title</FormLabel>
							<FormDescription className="mt-2 text-sm">
								A title should summarize the {resourceType.toUpperCase()} and
								explain what it is about clearly.
							</FormDescription>
							<FormControl>
								<Input {...field} />
							</FormControl>

							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					className="mt-2"
					variant="default"
					disabled={
						(form.formState.isDirty && !form.formState.isValid) ||
						form.formState.isSubmitting
					}
				>
					Create Draft {resourceType.toUpperCase()}
				</Button>
			</form>
		</Form>
	)
}
