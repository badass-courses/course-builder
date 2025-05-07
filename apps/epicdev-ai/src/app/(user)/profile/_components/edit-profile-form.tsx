'use client'

import React from 'react'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
import { disconnectDiscord } from '@/lib/discord-query'
import { disconnectGithub } from '@/lib/github-query'
import { Provider } from '@/server/auth'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from 'next-auth/react'
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
	useToast,
} from '@coursebuilder/ui'

const formSchema = z.object({
	name: z.string(),
	email: z.string().email(),
})

const EditProfileForm: React.FC<{
	user: any
	discordConnected?: boolean
	discordProvider?: Provider | null
	githubConnected?: boolean
	githubProvider?: Provider | null
}> = ({
	user,
	discordConnected,
	discordProvider,
	githubConnected,
	githubProvider,
}) => {
	const { update: updateSession } = useSession()
	const { mutateAsync: updateName } = api.users.updateName.useMutation()
	const { toast } = useToast()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name || '',
			email: user?.email || '',
		},
		values: {
			name: user?.name || '',
			email: user?.email || '',
		},
		reValidateMode: 'onBlur',
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		return await updateName(
			{ name: values.name },
			{
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
			},
		)
	}

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<fieldset className="space-y-5">
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
					</fieldset>
					{(discordProvider || githubProvider) && (
						<div>
							<h3 className="mt-5 pb-2 text-lg font-bold">Accounts</h3>
							{discordProvider && (
								<fieldset className="w-full">
									<ul className="divide-y border-b">
										<li className="flex items-center justify-between py-3">
											<h4 className="inline-flex items-center gap-2 font-medium">
												<Icon name="Discord" className="h-5 w-5" />
												Discord
											</h4>
											<div>
												{discordConnected ? (
													<Button
														type="button"
														variant="secondary"
														size="sm"
														onClick={async () => {
															await disconnectDiscord()
															window.location.reload()
														}}
													>
														Disconnect
													</Button>
												) : discordProvider ? (
													<Button
														type="button"
														size="sm"
														onClick={() => {
															signIn(discordProvider.id, {
																callbackUrl: `${env.NEXT_PUBLIC_URL}/profile`,
															})
														}}
													>
														Connect
													</Button>
												) : (
													<div className="text-sm font-semibold">N/A</div>
												)}
											</div>
										</li>
									</ul>
								</fieldset>
							)}
							{githubProvider && (
								<fieldset className="w-full">
									<ul className="divide-y border-b">
										<li className="flex items-center justify-between py-3">
											<h4 className="inline-flex items-center gap-2 font-medium">
												<Icon name="Github" className="h-5 w-5" />
												GitHub
											</h4>
											<div>
												{githubConnected ? (
													<Button
														type="button"
														variant="secondary"
														size="sm"
														onClick={async () => {
															await disconnectGithub()
															window.location.reload()
														}}
													>
														Disconnect
													</Button>
												) : githubProvider ? (
													<Button
														type="button"
														size="sm"
														onClick={() => {
															signIn(githubProvider.id, {
																callbackUrl: `${env.NEXT_PUBLIC_URL}/profile`,
															})
														}}
													>
														Connect
													</Button>
												) : (
													<div className="text-sm font-semibold">N/A</div>
												)}
											</div>
										</li>
									</ul>
								</fieldset>
							)}
						</div>
					)}
					{(form.formState.dirtyFields.name || form.formState.isSubmitting) && (
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
