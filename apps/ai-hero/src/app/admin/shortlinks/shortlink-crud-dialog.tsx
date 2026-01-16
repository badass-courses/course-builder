'use client'

import { useEffect, useState } from 'react'
import { isSlugAvailable } from '@/lib/shortlinks-query'
import { CreateShortlinkSchema, Shortlink } from '@/lib/shortlinks-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, RefreshCw } from 'lucide-react'
import { customAlphabet } from 'nanoid'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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

const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6,
)

const formSchema = z.object({
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(50, 'Slug must be 50 characters or less')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Slug can only contain letters, numbers, hyphens, and underscores',
		),
	url: z.string().url('Please enter a valid URL'),
	description: z
		.string()
		.max(255, 'Description must be 255 characters or less')
		.optional(),
})

type FormSchemaType = z.infer<typeof formSchema>

type ShortlinkCrudDialogProps = {
	shortlink?: Shortlink
	onSubmit: (data: {
		id?: string
		slug?: string
		url?: string
		description?: string
	}) => Promise<void>
	children: React.ReactNode
}

export default function ShortlinkCrudDialog({
	shortlink,
	onSubmit,
	children,
}: ShortlinkCrudDialogProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isCheckingSlug, setIsCheckingSlug] = useState(false)
	const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

	const form = useForm<FormSchemaType>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			slug: shortlink?.slug || '',
			url: shortlink?.url || '',
			description: shortlink?.description || '',
		},
	})

	const slugValue = form.watch('slug')

	useEffect(() => {
		if (shortlink) {
			form.reset({
				slug: shortlink.slug,
				url: shortlink.url,
				description: shortlink.description || '',
			})
		}
	}, [shortlink, form])

	useEffect(() => {
		// Don't check if editing and slug hasn't changed
		if (shortlink && slugValue === shortlink.slug) {
			setSlugAvailable(null)
			return
		}

		if (!slugValue || slugValue.length < 1) {
			setSlugAvailable(null)
			return
		}

		const checkSlug = async () => {
			setIsCheckingSlug(true)
			try {
				const available = await isSlugAvailable(slugValue)
				setSlugAvailable(available)
			} catch {
				setSlugAvailable(null)
			} finally {
				setIsCheckingSlug(false)
			}
		}

		const timeoutId = setTimeout(checkSlug, 300)
		return () => clearTimeout(timeoutId)
	}, [slugValue, shortlink])

	const generateSlug = () => {
		form.setValue('slug', nanoid())
	}

	const handleSubmit = async (values: FormSchemaType) => {
		try {
			if (shortlink) {
				await onSubmit({
					id: shortlink.id,
					slug: values.slug !== shortlink.slug ? values.slug : undefined,
					url: values.url !== shortlink.url ? values.url : undefined,
					description:
						values.description !== shortlink.description
							? values.description
							: undefined,
				})
			} else {
				await onSubmit({
					slug: values.slug,
					url: values.url,
					description: values.description || undefined,
				})
			}
			setIsOpen(false)
			form.reset()
			setSlugAvailable(null)
		} catch (error) {
			if (error instanceof Error && error.message === 'Slug already exists') {
				form.setError('slug', { message: 'This slug is already taken' })
			} else {
				throw error
			}
		}
	}

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open)
		if (open && !shortlink) {
			// Pre-fill slug with random value for new shortlinks
			form.setValue('slug', nanoid())
		}
		if (!open) {
			form.reset()
			setSlugAvailable(null)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{shortlink ? 'Edit Shortlink' : 'Create Shortlink'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<Input
													placeholder="my-link"
													{...field}
													className={
														slugAvailable === false
															? 'border-red-500'
															: slugAvailable === true
																? 'border-green-500'
																: ''
													}
												/>
												{isCheckingSlug && (
													<Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
												)}
											</div>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={generateSlug}
												title="Generate random slug"
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										</div>
									</FormControl>
									<FormDescription>
										The short URL will be: /s/{field.value || 'your-slug'}
									</FormDescription>
									{slugAvailable === false && (
										<p className="text-sm text-red-500">
											This slug is already taken
										</p>
									)}
									{slugAvailable === true && (
										<p className="text-sm text-green-500">
											This slug is available
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Destination URL</FormLabel>
									<FormControl>
										<Input placeholder="https://example.com/page" {...field} />
									</FormControl>
									<FormDescription>
										The URL to redirect to when the shortlink is visited
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
									<FormLabel>Description (optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="What is this link for?"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										A note to help you remember what this link is for
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									form.formState.isSubmitting ||
									isCheckingSlug ||
									slugAvailable === false
								}
							>
								{form.formState.isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{shortlink ? 'Updating...' : 'Creating...'}
									</>
								) : shortlink ? (
									'Update Shortlink'
								) : (
									'Create Shortlink'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
