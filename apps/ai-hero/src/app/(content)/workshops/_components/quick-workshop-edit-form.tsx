import * as React from 'react'
import { WorkshopFieldsSchema, type Workshop } from '@/lib/workshops'
import { updateWorkshop } from '@/lib/workshops-query'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { useForm } from 'react-hook-form'
import type z from 'zod'

import {
	Button,
	DateTimePicker,
	DialogFooter,
	DialogTrigger,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
	useToast,
} from '@coursebuilder/ui'
import Spinner from '@coursebuilder/ui/primitives/spinner'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

/**
 * Form content component that receives workshop data as prop
 */
function WorkshopFormContent({ workshop }: { workshop: Workshop }) {
	const form = useForm<z.infer<typeof WorkshopFieldsSchema>>({
		resolver: zodResolver(WorkshopFieldsSchema),
		defaultValues: {
			...workshop.fields,
			startsAt: workshop.fields.startsAt
				? new Date(workshop.fields.startsAt).toISOString()
				: undefined,
			endsAt: workshop.fields.endsAt
				? new Date(workshop.fields.endsAt).toISOString()
				: undefined,
		},
	})
	const { toast } = useToast()

	const onSubmit = async (data: z.infer<typeof WorkshopFieldsSchema>) => {
		try {
			await updateWorkshop({
				...workshop,
				fields: {
					...workshop.fields,
					...data,
				},
			})
			toast({
				title: 'Workshop updated',
				description: `Workshop "${data.title}" updated successfully`,
			})
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to update workshop',
				description: error instanceof Error ? error.message : 'Unknown error',
				variant: 'destructive',
			})
		}
	}

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Workshop title" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<MetadataFieldVisibility
					form={form}
					name="visibility"
					className="px-0 [&_label]:text-sm [&_label]:font-medium"
				/>
				<MetadataFieldState
					form={form}
					name="state"
					className="px-0 [&_label]:text-sm [&_label]:font-medium"
				/>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<Textarea {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="description"
				/>
				<FormField
					control={form.control}
					name="startsAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Starts at</FormLabel>
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
										!!date
											? date.toDate('America/Los_Angeles').toISOString()
											: null,
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
					name="endsAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Ends at</FormLabel>
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
										!!date
											? date.toDate('America/Los_Angeles').toISOString()
											: null,
									)
								}}
								shouldCloseOnSelect={false}
								granularity="minute"
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter className="mt-5">
					<DialogTrigger asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DialogTrigger>
					<DialogTrigger asChild>
						<Button type="submit" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? 'Saving...' : 'Save'}
						</Button>
					</DialogTrigger>
					{form.watch('state') === 'draft' && (
						<Button
							type="button"
							onClick={() => {
								form.setValue('state', 'published')
								form.handleSubmit(onSubmit)()
							}}
						>
							Save & publish
						</Button>
					)}
				</DialogFooter>
			</form>
		</Form>
	)
}

/**
 * Quick edit form for workshops opened from cohort list editor
 */
export default function QuickWorkshopEditForm({
	workshopId,
}: {
	workshopId: string
}) {
	const { data: workshop } = api.contentResources.getWorkshop.useQuery(
		{ id: workshopId },
		{
			enabled: !!workshopId,
		},
	)

	if (!workshop?.fields) {
		return (
			<div className="flex items-center gap-1">
				<Spinner className="size-5" /> Loading...
			</div>
		)
	}

	return <WorkshopFormContent key={workshopId} workshop={workshop} />
}
