'use client'

import * as React from 'react'
import { updateSectionFields } from '@/lib/sections-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'

import Spinner from '../spinner'

const SectionFieldsSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	slug: z.string().optional(),
	description: z.string().optional(),
	github: z.string().url().optional().or(z.literal('')),
	gitpod: z.string().url().optional().or(z.literal('')),
})

type SectionFields = z.infer<typeof SectionFieldsSchema>

/**
 * Props for the EditSectionDialog component
 */
interface EditSectionDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	sectionId: string
	initialValues: {
		title?: string
		slug?: string
		description?: string
		github?: string
		gitpod?: string
	}
	onSuccess?: (updatedFields: SectionFields) => void
}

/**
 * Modal dialog for editing section metadata
 * Allows editing title, slug, description, github, and gitpod URLs
 */
export function EditSectionDialog({
	open,
	onOpenChange,
	sectionId,
	initialValues,
	onSuccess,
}: EditSectionDialogProps) {
	const [isPending, startTransition] = React.useTransition()

	const form = useForm<SectionFields>({
		resolver: zodResolver(SectionFieldsSchema),
		defaultValues: {
			title: initialValues.title || '',
			slug: initialValues.slug || '',
			description: initialValues.description || '',
			github: initialValues.github || '',
			gitpod: initialValues.gitpod || '',
		},
	})

	// Reset form when dialog opens with new values
	React.useEffect(() => {
		if (open) {
			form.reset({
				title: initialValues.title || '',
				slug: initialValues.slug || '',
				description: initialValues.description || '',
				github: initialValues.github || '',
				gitpod: initialValues.gitpod || '',
			})
		}
	}, [open, initialValues, form])

	const onSubmit = (data: SectionFields) => {
		startTransition(async () => {
			try {
				// Clean up empty strings to undefined for optional URL fields
				const cleanedData = {
					...data,
					github: data.github || undefined,
					gitpod: data.gitpod || undefined,
					description: data.description || undefined,
				}

				await updateSectionFields(sectionId, cleanedData)
				onSuccess?.(data)
				onOpenChange(false)
			} catch (error) {
				console.error('Failed to update section:', error)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange} modal={false}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Section</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Section title" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="section-slug" {...field} />
									</FormControl>
									<FormDescription>
										Leave empty to auto-generate from title
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Brief description of this section"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="github"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GitHub URL</FormLabel>
									<FormControl>
										<Input
											type="url"
											placeholder="https://github.com/..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Repository URL for this section&apos;s code
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="gitpod"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gitpod URL</FormLabel>
									<FormControl>
										<Input
											type="url"
											placeholder="https://gitpod.io/#..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Gitpod workspace URL for this section
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										Saving...
									</>
								) : (
									'Save Changes'
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
