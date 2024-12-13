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
	Input,
	Textarea,
	useToast,
} from '@coursebuilder/ui'

const formSchema = z.object({
	name: z.string(),
	blueSky: z.string(),
	twitter: z.string(),
	website: z.string(),
	bio: z.string(),
})

const EditProfileForm: React.FC<{
	user: any
}> = ({ user }) => {
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)
	const isContributor = ability.can('create', 'Content')

	const instructorProfile = user?.profiles.find(
		(p: { type: string }) => p.type === 'instructor',
	)

	const { mutateAsync: updateProfile } = api.users.updateProfile.useMutation()
	const { toast } = useToast()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || '',
			blueSky: instructorProfile?.fields?.blueSky || '',
			twitter: instructorProfile?.fields?.twitter || '',
			website: instructorProfile?.fields?.website || '',
			bio: instructorProfile?.fields?.bio || '',
		},
		values: {
			name: user?.name || '',
			blueSky: instructorProfile?.fields?.blueSky || '',
			twitter: instructorProfile?.fields?.twitter || '',
			website: instructorProfile?.fields?.website || '',
			bio: instructorProfile?.fields?.bio || '',
		},
		reValidateMode: 'onBlur',
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		return await updateProfile(
			{ ...values, userId: user.id },
			{
				onSuccess: async (data) => {
					form.reset()
					form.setValue('name', data.name as string)
					form.setValue('blueSky', data.blueSky as string)
					form.setValue('twitter', data.twitter as string)
					form.setValue('website', data.website as string)
					form.setValue('bio', data.bio as string)
					toast({ title: 'Profile updated successfully!' })
				},
			},
		)
	}

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<fieldset className="space-y-5">
						{isContributor && (
							<>
								<h1 className="text-xl font-semibold">Your Profile</h1>
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
									name="blueSky"
									render={({ field }) => (
										<FormItem>
											<FormLabel htmlFor="blueSky">Bluesky</FormLabel>
											<FormControl>
												<Input
													id="blueSky"
													{...field}
													onChange={field.onChange}
												/>
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
												<Input
													id="twitter"
													{...field}
													onChange={field.onChange}
												/>
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
												<Input
													id="website"
													{...field}
													onChange={field.onChange}
												/>
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
												<Textarea
													rows={5}
													{...field}
													value={field.value ?? ''}
												/>
											</FormControl>
											<FormDescription>
												A short bio about yourself.
											</FormDescription>
										</FormItem>
									)}
								/>
							</>
						)}
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
