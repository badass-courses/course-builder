'use client'

import React from 'react'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clipboard } from 'lucide-react'
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
	useToast,
} from '@coursebuilder/ui'

const formSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	affiliateCode: z.string(),
	slackChannelId: z.string(),
	slackId: z.string(),
})

const EditAccountForm: React.FC<{
	user: any
}> = ({ user }) => {
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)

	const isAdmin = ability.can('manage', 'all')
	const isContributor = ability.can('create', 'Content')

	const { mutateAsync: updateInstructorAccount } =
		api.users.updateInstructorAccount.useMutation({
			onSuccess: async (data) => {
				form.reset()
				form.setValue('slackChannelId', data.slackChannelId as string)
				form.setValue('slackId', data.slackId as string)
				toast({ title: 'Profile updated successfully!' })
			},
		})
	const { toast } = useToast()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || '',
			email: user?.email || '',
			affiliateCode: user?.fields?.affiliateCode || '',
			slackChannelId: user?.fields?.slackChannelId || '',
			slackId: user?.fields?.slackId || '',
		},
		values: {
			name: user?.name || '',
			email: user?.email || '',
			affiliateCode: user?.fields?.affiliateCode || '',
			slackChannelId: user?.fields?.slackChannelId || '',
			slackId: user?.fields?.slackId || '',
		},
		reValidateMode: 'onBlur',
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		return await updateInstructorAccount(
			{ ...values, userId: user.id },
			{
				onSuccess: async (data) => {
					form.reset()
					form.setValue('slackChannelId', data.slackChannelId as string)
					form.setValue('slackId', data.slackId as string)
					toast({ title: 'Account updated successfully!' })
				},
			},
		)
	}

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<fieldset className="space-y-5">
						<h1 className="text-xl font-semibold">Account Information</h1>
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
						{user?.fields?.affiliateCode && isContributor && (
							<FormField
								name="affiliateCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel htmlFor="affiliateCode">
											<div className="flex items-center gap-2">
												<p>Affiliate Code</p>
												<button
													className="rounded-md p-1 hover:bg-gray-100"
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(
															`?af=${user?.fields?.affiliateCode}`,
														)
														toast({
															title: 'Affiliate Code Copied to Clipboard',
														})
													}}
												>
													<Clipboard className="h-4 w-4" />
												</button>
											</div>
										</FormLabel>
										<FormControl>
											<Input
												readOnly
												id="affiliateCode"
												{...field}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormDescription>
											Append your code to the end of egghead URLs to track your
											referrals. e.g. ?af={user?.fields?.affiliateCode}
										</FormDescription>
									</FormItem>
								)}
							/>
						)}
						{isAdmin && (
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
												Slack Channel ID
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

export default EditAccountForm
