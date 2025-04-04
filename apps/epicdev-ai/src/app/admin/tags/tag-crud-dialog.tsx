import { useEffect, useState } from 'react'
import { TagFieldsSchema, type Tag } from '@/lib/tags'
import { guid } from '@/utils/guid'
import { zodResolver } from '@hookform/resolvers/zod'
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'

const formSchema = TagFieldsSchema

type FormSchemaType = z.infer<typeof formSchema>

type TagCrudDialogProps = {
	tag?: Tag
	onSubmit: (tag: Tag) => void
	children: React.ReactNode
}

export default function TagCrudDialog({
	tag,
	onSubmit,
	children,
}: TagCrudDialogProps) {
	const [isOpen, setIsOpen] = useState(false)

	const form = useForm<FormSchemaType>({
		resolver: zodResolver(formSchema),
		defaultValues: tag?.fields || {
			label: '',
			name: '',
			description: null,
			slug: '',
			image_url: null,
			contexts: [],
			url: null,
			popularity_order: 0,
		},
	})

	useEffect(() => {
		if (tag?.fields) {
			form.reset(tag.fields)
		}
	}, [tag, form])

	const handleSubmit = (values: FormSchemaType) => {
		const submittedTag: Tag = tag
			? { ...tag, fields: { ...tag.fields, ...values } }
			: {
					id: guid(),
					type: 'topic',
					fields: { ...values },
					createdAt: new Date(),
					updatedAt: new Date(),
				}
		onSubmit(submittedTag)
		setIsOpen(false)
		form.reset()
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{tag ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="label"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Label</FormLabel>
									<FormControl>
										<Input placeholder="Tag Label" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Tag name" {...field} />
									</FormControl>
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
										<Input
											type="text"
											placeholder="Tag description"
											{...field}
											value={field.value ?? ''}
										/>
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
										<Input placeholder="tag-slug" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="image_url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Image URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://example.com/image.png"
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="contexts"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contexts (comma-separated)</FormLabel>
									<FormControl>
										<Input
											placeholder="libraries,frameworks"
											{...field}
											value={field.value ? field.value.join(',') : ''}
											onChange={(e) =>
												field.onChange(e.target.value.split(','))
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://example.com"
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="popularity_order"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Popularity Order</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="1"
											{...field}
											value={field.value?.toString() ?? ''}
											onChange={(e) =>
												field.onChange(
													e.target.value ? parseInt(e.target.value, 10) : null,
												)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">{tag ? 'Update Tag' : 'Add Tag'}</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
