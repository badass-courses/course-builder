'use client'

import * as React from 'react'
import { ResourceFormProps } from '@/components/resource-form/with-resource-form'
import { Workshop, WorkshopSchema } from '@/lib/workshops'
import { parseAbsolute } from '@internationalized/date'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	DateTimePicker,
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
 * Hook to track client-side mounting for hydration-sensitive components
 */
function useIsMounted() {
	const [isMounted, setIsMounted] = React.useState(false)
	React.useEffect(() => {
		setIsMounted(true)
	}, [])
	return isMounted
}

// Fetcher helper for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Common timezone options
const TIMEZONES = [
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Phoenix',
	'America/Anchorage',
	'Pacific/Honolulu',
	'Europe/London',
	'Europe/Paris',
	'Europe/Berlin',
	'Asia/Tokyo',
	'Asia/Shanghai',
	'Australia/Sydney',
]

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
	const isMounted = useIsMounted()

	const { data: session } = useSession()
	const isAdmin = session?.user?.roles?.some(
		(role: any) => role.name === 'admin',
	)

	const { data: authorsData } = useSWR(isAdmin ? '/api/authors' : null, fetcher)
	const authors = (authorsData?.authors as any[]) ?? []

	// If form is not available, don't render anything
	if (!form) return null

	return (
		<>
			<FormField
				control={form.control}
				name="fields.title"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Title</FormLabel>
						<FormDescription>
							A title should summarize the workshop and explain what it is about
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
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Description</FormLabel>
						<FormDescription>
							A short description of the workshop for SEO and previews.
						</FormDescription>
						<Textarea rows={4} {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.github"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub</FormLabel>
						<FormDescription>
							Direct link to the GitHub repository associated with the workshop.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="px-5">
				<FormLabel className="text-lg font-bold">Cover Image</FormLabel>
				{form.watch('fields.coverImage.url') && (
					<img
						src={form.watch('fields.coverImage.url')}
						alt={form.watch('fields.coverImage.alt') ?? 'Workshop cover'}
						className="mt-2 max-w-full rounded"
					/>
				)}
			</div>
			<FormField
				control={form.control}
				name="fields.coverImage.url"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Cover Image URL</FormLabel>
						<FormDescription>
							URL to the cover image for the workshop.
						</FormDescription>
						<Input
							{...field}
							onDrop={(e) => {
								const result = e.dataTransfer.getData('text/plain')
								const urlRegex = /(https?:\/\/[^\s"'<>()[\]{}]+)/
								const parsedResult = result.match(urlRegex)
								if (parsedResult) {
									field.onChange(parsedResult[1])
								}
							}}
							value={field.value ?? ''}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.coverImage.alt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Cover Image Alt Text</FormLabel>
						<FormDescription>
							Alternative text for accessibility and SEO.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
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
						<FormDescription>
							The timezone for workshop start and end times.
						</FormDescription>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<SelectTrigger>
								<SelectValue placeholder="Select timezone" />
							</SelectTrigger>
							<SelectContent>
								{TIMEZONES.map((tz) => (
									<SelectItem key={tz} value={tz}>
										{tz}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
				name="fields.startsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Start Date/Time</FormLabel>
						<FormDescription>
							When the workshop begins (in the selected timezone).
						</FormDescription>
						{isMounted ? (
							<DateTimePicker
								{...field}
								value={
									field.value
										? parseAbsolute(
												new Date(field.value).toISOString(),
												form.watch('fields.timezone') || 'America/Los_Angeles',
											)
										: null
								}
								onChange={(date) => {
									field.onChange(
										date
											? date.toDate(
													form.watch('fields.timezone') ||
														'America/Los_Angeles',
												)
											: null,
									)
								}}
								shouldCloseOnSelect={false}
								granularity="minute"
							/>
						) : (
							<Input disabled placeholder="Loading..." />
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.endsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">End Date/Time</FormLabel>
						<FormDescription>
							When the workshop ends (in the selected timezone).
						</FormDescription>
						{isMounted ? (
							<DateTimePicker
								{...field}
								value={
									field.value
										? parseAbsolute(
												new Date(field.value).toISOString(),
												form.watch('fields.timezone') || 'America/Los_Angeles',
											)
										: null
								}
								onChange={(date) => {
									field.onChange(
										date
											? date.toDate(
													form.watch('fields.timezone') ||
														'America/Los_Angeles',
												)
											: null,
									)
								}}
								shouldCloseOnSelect={false}
								granularity="minute"
							/>
						) : (
							<Input disabled placeholder="Loading..." />
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			{isAdmin && (
				<FormField
					control={form.control}
					name="createdById"
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Author</FormLabel>
							<FormDescription>
								Select the author for this workshop.
							</FormDescription>
							<Select onValueChange={field.onChange} value={field.value ?? ''}>
								<SelectTrigger>
									<SelectValue placeholder="Select author" />
								</SelectTrigger>
								<SelectContent>
									{authors.map((author) => (
										<SelectItem key={author.id} value={author.id}>
											{author.displayName ||
												author.name ||
												author.email ||
												author.id}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
		</>
	)
}
