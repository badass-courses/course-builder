'use client'

import React from 'react'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
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
	Textarea,
	useToast,
} from '@coursebuilder/ui'

const formSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	blueSky: z.string(),
	twitter: z.string(),
	website: z.string(),
	bio: z.string(),
})

const EditProfileForm: React.FC<{
	user: any
}> = ({ user }) => {
	const { update: updateSession } = useSession()
	const { mutateAsync: updateProfile } = api.users.updateProfile.useMutation()
	const { toast } = useToast()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || '',
			email: user?.email || '',
			blueSky: user?.fields?.blueSky || '',
			twitter: user?.fields?.twitter || '',
			website: user?.fields?.website || '',
			bio: user?.fields?.bio || '',
		},
		values: {
			name: user?.name || '',
			email: user?.email || '',
			blueSky: user?.fields?.blueSky || '',
			twitter: user?.fields?.twitter || '',
			website: user?.fields?.website || '',
			bio: user?.fields?.bio || '',
		},
		reValidateMode: 'onBlur',
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		return await updateProfile(values, {
			onSuccess: async (data) => {
				await updateSession(() => {
					return {
						user: {
							name: values.name,
						},
					}
				})
				form.reset()
				form.setValue('name', values.name as string)
				toast({ title: 'Profile updated successfully!' })
			},
		})
	}

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<fieldset className="space-y-5">
						<FormField
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="email">Email</FormLabel>
									<FormControl>
										<Input
											readOnly
											disabled
											id="email"
											{...field}
											onChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="name">Name</FormLabel>
									<FormControl>
										<Input
											id="name"
											{...field}
											required
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription></FormDescription>
								</FormItem>
							)}
						/>
						<FormField
							name="Blue Sky"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="blueSky">Blue Sky</FormLabel>
									<FormControl>
										<Input id="blueSky" {...field} onChange={field.onChange} />
									</FormControl>
									<FormDescription></FormDescription>
								</FormItem>
							)}
						/>
						<FormField
							name="twitter"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="twitter">Twitter</FormLabel>
									<FormControl>
										<Input id="twitter" {...field} onChange={field.onChange} />
									</FormControl>
									<FormDescription></FormDescription>
								</FormItem>
							)}
						/>
						<FormField
							name="website"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="website">Website</FormLabel>
									<FormControl>
										<Input id="website" {...field} onChange={field.onChange} />
									</FormControl>
									<FormDescription></FormDescription>
								</FormItem>
							)}
						/>
						<FormField
							name="bio"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="bio">Bio</FormLabel>
									<FormControl>
										<Textarea rows={5} {...field} value={field.value ?? ''} />
									</FormControl>
									<FormDescription>A short bio about yourself.</FormDescription>
								</FormItem>
							)}
						/>
					</fieldset>
					{(Object.keys(form.formState.dirtyFields).length > 0 ||
						form.formState.isSubmitting) && (
						<Button type="submit" disabled={form.formState.isSubmitting}>
							Update profile
						</Button>
					)}
				</form>
			</Form>
		</div>
	)
}

export default EditProfileForm