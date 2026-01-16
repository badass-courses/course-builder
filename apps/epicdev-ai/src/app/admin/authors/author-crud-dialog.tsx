'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
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

const formSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Please enter a valid email address'),
})

type FormSchemaType = z.infer<typeof formSchema>

type AuthorCrudDialogProps = {
	onSubmit: (email: string, name: string) => void
	children: React.ReactNode
}

/**
 * Dialog for adding an author role to a user.
 * Uses name and email inputs to find or create the user.
 */
export default function AuthorCrudDialog({
	onSubmit,
	children,
}: AuthorCrudDialogProps) {
	const [isOpen, setIsOpen] = useState(false)

	const form = useForm<FormSchemaType>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			email: '',
		},
	})

	const handleSubmit = (values: FormSchemaType) => {
		onSubmit(values.email, values.name)
		setIsOpen(false)
		form.reset()
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Author</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Author name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="author@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Add Author Role</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
