'use client'

import React from 'react'
import { createAppAbility } from '@/ability'
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
	Gravatar,
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
	slackChannelId: z.string(),
	slackId: z.string(),
})

const EditProfileForm: React.FC<{
	user: any
}> = ({ user }) => {
	const { update: updateSession, data: session } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)

	console.log({ user })

	const instructorProfile = user?.profiles.find(
		(p: { type: string }) => p.type === 'instructor',
	)

	console.log({ instructorProfile })

	const { mutateAsync: updateProfile } = api.users.updateProfile.useMutation()
	const { toast } = useToast()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || '',
			email: user?.email || '',
			blueSky: instructorProfile?.fields?.blueSky || '',
			twitter: instructorProfile?.fields?.twitter || '',
			website: instructorProfile?.fields?.website || '',
			bio: instructorProfile?.fields?.bio || '',
			slackChannelId: user?.fields?.slackChannelId || '',
			slackId: user?.fields?.slackId || '',
		},
		values: {
			name: user?.name || '',
			email: user?.email || '',
			blueSky: instructorProfile?.fields?.blueSky || '',
			twitter: instructorProfile?.fields?.twitter || '',
			website: instructorProfile?.fields?.website || '',
			bio: instructorProfile?.fields?.bio || '',
			slackChannelId: user?.fields?.slackChannelId || '',
			slackId: user?.fields?.slackId || '',
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
						<h2 className="text-xl font-semibold">Private</h2>
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
									<FormDescription>
										Contact egghead staff to update your email.
									</FormDescription>
								</FormItem>
							)}
						/>
						<FormField
							name="affiliateCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="affiliateCode">Affiliate Code</FormLabel>
									<FormControl>
										<Input
											readOnly
											disabled
											id="affiliateCode"
											{...field}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>
										Append your code to the end of egghead URLs to track your
										referrals.
									</FormDescription>
								</FormItem>
							)}
						/>
						<Gravatar
							className="h-20 w-20 rounded-full"
							email={user?.email}
							default="mp"
						/>
						<p className="text-muted-foreground text-sm">
							Change your personal account avatar at{' '}
							<a
								href="https://gravatar.com"
								target="_blank"
								rel="noreferrer"
								className="underline"
							>
								Gravatar.com
							</a>
						</p>
						{ability.can('manage', 'all') && (
							<>
								<h3 className="text-lg font-semibold">Admin</h3>
								<FormField
									name="slackId"
									render={({ field }) => (
										<FormItem>
											<FormLabel htmlFor="slackId">Slack ID</FormLabel>
											<FormControl>
												<Input
													id="slackId"
													{...field}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormDescription></FormDescription>
										</FormItem>
									)}
								/>
								<FormField
									name="slackChannelId"
									render={({ field }) => (
										<FormItem>
											<FormLabel htmlFor="slackChannelId">
												Slack Group ID
											</FormLabel>
											<FormControl>
												<Input
													id="slackChannelId"
													{...field}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormDescription></FormDescription>
										</FormItem>
									)}
								/>
							</>
						)}
						<hr />
						<h2 className="text-xl font-semibold">
							Instructor Profile (public)
						</h2>
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
