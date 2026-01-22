'use client'

import * as React from 'react'
import Spinner from '@/components/spinner'
import { track } from '@/utils/analytics'
import axios from 'axios'
import { CheckCircle } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

type State = 'idle' | 'loading' | 'success' | 'error'

interface LoggedInWaitlistButtonProps {
	email: string
	name?: string
	fields?: Record<string, string>
	actionLabel?: string
	className?: string
	onSuccess?: () => void
	productName?: string
	productId?: string
}

/**
 * A button component for authenticated users to join a waitlist
 *
 * Handles the subscription to ConvertKit list via POST to /api/coursebuilder/subscribe-to-list/convertkit
 * Tracks the join event using @skillrecordings/analytics
 *
 * @param email - User's email address (required)
 * @param name - User's name (optional)
 * @param fields - ConvertKit custom fields as key-value pairs
 * @param actionLabel - Button label (defaults to 'Join Waitlist')
 * @param className - Additional CSS classes for the button
 * @param onSuccess - Callback fired on successful subscription
 * @param productName - Product name for analytics tracking
 * @param productId - Product ID for analytics tracking
 *
 * @example
 * ```tsx
 * <LoggedInWaitlistButton
 *   email={user.email}
 *   name={user.name}
 *   productName="Advanced React Workshop"
 *   productId="workshop-123"
 *   onSuccess={() => console.log('Joined!')}
 * />
 * ```
 */
export function LoggedInWaitlistButton({
	email,
	name,
	fields,
	actionLabel = 'Join Waitlist',
	className,
	onSuccess,
	productName,
	productId,
}: LoggedInWaitlistButtonProps) {
	const [state, setState] = React.useState<State>('idle')

	const handleJoinWaitlist = async () => {
		setState('loading')

		try {
			await axios.post('/api/coursebuilder/subscribe-to-list/convertkit', {
				email,
				name,
				fields,
			})

			setState('success')

			track('waitlist_joined', {
				product_name: productName,
				product_id: productId,
				email,
			})

			onSuccess?.()
		} catch (error) {
			setState('error')
			console.error('Failed to join waitlist:', error)
		}
	}

	if (state === 'success') {
		return (
			<div className="flex items-center gap-2 text-sm font-medium text-green-600">
				<CheckCircle className="h-5 w-5" />
				<span>You're on the waitlist</span>
			</div>
		)
	}

	return (
		<Button
			onClick={handleJoinWaitlist}
			disabled={state === 'loading'}
			className={className}
		>
			{state === 'loading' ? (
				<>
					<Spinner className="mr-2 h-4 w-4" />
					Joining...
				</>
			) : (
				actionLabel
			)}
		</Button>
	)
}
