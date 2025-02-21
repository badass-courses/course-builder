'use client'

import * as React from 'react'
import { DateTimePicker } from '@/app/(content)/events/[slug]/edit/_components/date-time-picker/date-time-picker'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import ListResoucesEdit from '@/components/list-editor/list-resources-edit'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Cohort, CohortSchema } from '@/lib/cohort'
import { updateResource } from '@/lib/resources-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

import { onCohortSave } from '../actions'

export function EditCohortForm({ cohort }: { cohort: Cohort }) {
	const { data: session } = useSession()
	const { theme } = useTheme()
	const form = useForm<z.infer<typeof CohortSchema>>({
		resolver: zodResolver(CohortSchema),
		defaultValues: {
			...cohort,
			fields: {
				...cohort.fields,
				...(cohort.fields.startsAt && {
					startsAt: new Date(cohort.fields.startsAt).toISOString(),
				}),
				...(cohort.fields.endsAt && {
					endsAt: new Date(cohort.fields.endsAt).toISOString(),
				}),
				title: cohort.fields.title || '',
				visibility: cohort.fields.visibility || 'public',
				image: cohort.fields.image,
				description: cohort.fields.description ?? '',
				slug: cohort.fields.slug ?? '',
				timezone: cohort.fields.timezone || 'America/Los_Angeles',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<ResourceForm
			resource={cohort}
			form={form}
			resourceSchema={CohortSchema}
			getResourcePath={(slug?: string) => `/cohorts/${slug}`}
			updateResource={updateResource}
			onSave={onCohortSave}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Article Chat',
					default: true,
				},
			]}
			bodyPanelSlot={
				<ListResoucesEdit
					list={cohort}
					showTierSelector
					createPostConfig={{
						title: 'Create a Lesson',
						defaultResourceType: 'cohort-lesson',
						availableResourceTypes: ['cohort-lesson'],
					}}
				/>
			}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.user}
			tools={[
				{ id: 'assistant' },
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							key={'image-uploader'}
							belongsToResourceId={cohort.id}
							uploadDirectory={`cohorts`}
						/>
					),
				},
			]}
			theme={theme}
		>
			<CohortMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const CohortMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof CohortSchema>>
}) => {
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
								console.log(e)
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
