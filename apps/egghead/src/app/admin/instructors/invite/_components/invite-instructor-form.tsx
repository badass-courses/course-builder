'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

import { inviteInstructor } from '../actions'

const formSchema = z.object({
	email: z.string().email(),
})

type FormValues = z.infer<typeof formSchema>

export function InviteInstructorForm() {
	const router = useRouter()
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
		},
	})

	const onSubmit = async (data: FormValues) => {
		try {
			await inviteInstructor(data.email)
			router.refresh()
			form.reset({ email: '' }, { keepDefaultValues: true })
		} catch (error) {
			console.error('Failed to invite instructor:', error)
		}
	}

	return (
		<div className="max-w-sm">
			<h2 className="pb-4 text-lg font-bold">Invite New Instructor</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="sr-only">Email</FormLabel>
								<FormControl>
									<Input placeholder="email@example.com" {...field} />
								</FormControl>
								<FormDescription>
									Enter the email of the instructor you want to invite.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					{(Object.keys(form.formState.dirtyFields).length > 0 ||
						form.formState.isSubmitting) && (
						<Button type="submit" disabled={form.formState.isSubmitting}>
							Send Invite
						</Button>
					)}
				</form>
			</Form>
		</div>
	)
}
