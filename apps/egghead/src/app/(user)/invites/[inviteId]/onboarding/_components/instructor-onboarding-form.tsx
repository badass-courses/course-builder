'use client'

import { useState } from 'react'

import { Button, Input, Label, Textarea, useToast } from '@coursebuilder/ui'

import { createInstructorProfile } from '../actions'

interface InstructorOnboardingFormProps {
	inviteId: string
	acceptedEmail: string
}

export function InstructorOnboardingForm({
	inviteId,
	acceptedEmail,
}: InstructorOnboardingFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { toast } = useToast()

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsSubmitting(true)

		const formData = new FormData(e.currentTarget)

		try {
			await createInstructorProfile({
				inviteId,
				firstName: formData.get('firstName') as string,
				lastName: formData.get('lastName') as string,
				email: formData.get('email') as string,
				twitter: formData.get('twitter') as string,
				bluesky: formData.get('bluesky') as string,
				website: formData.get('website') as string,
				bio: formData.get('bio') as string,
			})
		} catch (error) {
			if ((error as Error).message === 'NEXT_REDIRECT') {
				toast({
					title: 'Invitation accepted!',
					description: 'Your instructor profile has been created successfully.',
				})
			} else {
				toast({
					title: 'Error',
					description: 'Failed to accept invitation. Please try again.',
					variant: 'destructive',
				})
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="firstName">First name *</Label>
						<Input
							id="firstName"
							name="firstName"
							required
							disabled={isSubmitting}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last name *</Label>
						<Input
							id="lastName"
							name="lastName"
							required
							disabled={isSubmitting}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">egghead.io User email *</Label>
					<Input
						id="email"
						name="email"
						type="email"
						defaultValue={acceptedEmail}
						required
						disabled={true}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="twitter">Twitter</Label>
					<Input id="twitter" name="twitter" disabled={isSubmitting} />
				</div>

				<div className="space-y-2">
					<Label htmlFor="bluesky">BlueSky</Label>
					<Input id="bluesky" name="bluesky" disabled={isSubmitting} />
				</div>

				<div className="space-y-2">
					<Label htmlFor="website">Website</Label>
					<Input
						id="website"
						name="website"
						type="url"
						disabled={isSubmitting}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="bio">Bio short</Label>
					<Textarea
						id="bio"
						name="bio"
						placeholder="Please tell us a bit about yourself. What do you like to do?"
						className="h-32"
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating Profile...' : 'Create Profile'}
			</Button>
		</form>
	)
}
