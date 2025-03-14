'use client'

import { useState } from 'react'
import { acceptInstructorInvite } from '@/lib/actions/accept-instructor-invite'

import { Button, Input, Label, useToast } from '@coursebuilder/ui'

interface AcceptInviteFormProps {
	inviteId: string
	inviteEmail: string
}

export function AcceptInviteForm({
	inviteId,
	inviteEmail,
}: AcceptInviteFormProps) {
	const [email, setEmail] = useState(inviteEmail)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { toast } = useToast()

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			await acceptInstructorInvite({ inviteId, email })
			toast({
				title: 'Invitation accepted!',
				description: 'You will be redirected to complete your profile.',
			})
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to accept invitation. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<p className="text-sm text-gray-500">
					Please enter the email address you would like to use as your
					instructor account for egghead. We've pre-filled this with the email
					address you were invited with.
				</p>
				<Input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isSubmitting}
				/>
			</div>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Accepting...' : 'Accept Invitation'}
			</Button>
		</form>
	)
}
