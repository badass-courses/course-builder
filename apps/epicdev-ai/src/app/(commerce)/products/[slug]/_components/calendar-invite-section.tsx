'use client'

import * as React from 'react'
import {
	getProductEventInviteStatus,
	sendCalendarInvitesToNewPurchasersOnly,
	triggerBulkCalendarInvites,
} from '@/app/(commerce)/products/[slug]/calendar-invite-actions'
import type { ProductEventInviteStatus } from '@/app/(commerce)/products/[slug]/calendar-invite-types'
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Mail,
	Users,
	XCircle,
} from 'lucide-react'

import type { Product } from '@coursebuilder/core/schemas'
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

interface CalendarInviteSectionProps {
	product: Product
	purchaseCount: number
	inviteStatus: ProductEventInviteStatus | null
}

export function CalendarInviteSection({
	product,
	purchaseCount,
	inviteStatus: initialInviteStatus,
}: CalendarInviteSectionProps) {
	const [isLoading, setIsLoading] = React.useState(false)
	const [inviteStatus, setInviteStatus] =
		React.useState<ProductEventInviteStatus | null>(initialInviteStatus)
	const [result, setResult] = React.useState<{
		success: boolean
		message: string
		results?: any
	} | null>(null)

	// Update invite status from props when it changes
	React.useEffect(() => {
		setInviteStatus(initialInviteStatus)
	}, [initialInviteStatus])

	const handleSendInvites = async () => {
		setIsLoading(true)
		setResult(null)

		try {
			// Determine if we should use background processing
			const totalInvitesToProcess =
				inviteStatus?.events.reduce((total, event) => {
					const eventInviteCount = event.calendarEvents.length * purchaseCount
					return total + eventInviteCount
				}, 0) || 0

			// Use background processing for large operations (>200 total API calls)
			const useBackgroundJob = totalInvitesToProcess > 200

			if (useBackgroundJob) {
				const response = await triggerBulkCalendarInvites(product.id)
				setResult(response)

				// Don't reload status for background jobs - user will get email notification
			} else {
				const response = await sendCalendarInvitesToNewPurchasersOnly(
					product.id,
				)
				setResult(response)

				// Reload invite status after sending invites
				if (response.success) {
					const updatedStatus = await getProductEventInviteStatus(product.id)
					setInviteStatus(updatedStatus)
				}
			}
		} catch (error) {
			setResult({
				success: false,
				message: `Failed to send invites: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Don't render anything if not a cohort product
	if (product.type !== 'cohort') {
		return null
	}

	// Don't render if no invite status or no events found
	if (!inviteStatus?.success || inviteStatus.events.length === 0) {
		return null
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					Calendar Invitations
				</CardTitle>
				<CardDescription>
					Send calendar invites to all purchasers for office hours events
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Invite Status Summary */}
				{inviteStatus?.success && (
					<div className="space-y-3 rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium">Invite Status</h4>
							<div className="flex items-center gap-2 text-sm">
								{inviteStatus.inviteComparison.inviteRate >= 90 ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : inviteStatus.inviteComparison.inviteRate >= 50 ? (
									<AlertCircle className="h-4 w-4 text-yellow-500" />
								) : (
									<XCircle className="h-4 w-4 text-red-500" />
								)}
								{inviteStatus.inviteComparison.inviteRate}% invited
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4 text-sm">
							<div>
								<div className="text-muted-foreground">Total Purchasers</div>
								<div className="font-medium">
									{inviteStatus.totalPurchasers}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground">Invited</div>
								<div className="font-medium text-green-600">
									{inviteStatus.inviteComparison.totalUniqueInvited}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground">Not Invited</div>
								<div className="font-medium text-red-600">
									{inviteStatus.inviteComparison.notInvited.length}
								</div>
							</div>
						</div>

						{inviteStatus.inviteComparison.invitedButNotPurchased.length >
							0 && (
							<div className="border-t pt-2">
								<div className="text-xs text-yellow-600">
									⚠️{' '}
									{inviteStatus.inviteComparison.invitedButNotPurchased.length}{' '}
									attendees found who haven't purchased this product
								</div>
							</div>
						)}
					</div>
				)}

				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Users className="h-4 w-4" />
							{purchaseCount} Purchasers
						</div>
						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<Calendar className="h-4 w-4" />
							{inviteStatus.events.length} Office Hours Event
							{inviteStatus.events.length !== 1 ? 's' : ''}
						</div>
					</div>
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" className="flex items-center gap-2">
								<Mail className="h-4 w-4" />
								Send Invites
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Send Calendar Invitations</DialogTitle>
								<DialogDescription>
									This will send Google Calendar invitations to all{' '}
									{purchaseCount} purchasers of "{product.name}" for the
									following office hours events:
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								{/* Event List */}
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Events to invite to:</h4>
									{inviteStatus?.success &&
										inviteStatus.events.map((eventStatus) => (
											<div
												key={eventStatus.eventId}
												className="space-y-2 rounded-md border p-3 text-sm"
											>
												<div className="flex items-center justify-between">
													<div className="font-medium">
														{eventStatus.eventTitle}
													</div>
													<div className="text-muted-foreground text-xs">
														{eventStatus.totalAttendees} current attendees
													</div>
												</div>

												{eventStatus.calendarEvents.map((calEvent) => (
													<div
														key={calEvent.calendarId}
														className="text-muted-foreground border-l-2 border-gray-200 pl-2 text-xs"
													>
														<div>{calEvent.eventTitle}</div>
														<div>{calEvent.attendeeCount} attendees</div>
													</div>
												))}

												{eventStatus.eventType === 'event-series' && (
													<div className="text-muted-foreground text-xs">
														Event series with{' '}
														{eventStatus.calendarEvents.length} calendar events
													</div>
												)}
											</div>
										))}
								</div>

								{/* Action Button */}
								<div className="flex items-center justify-between">
									<div className="text-muted-foreground text-sm">
										This action will add purchasers to the Google Calendar
										events. Users already invited will be skipped. Large
										operations will be processed in the background.
									</div>
									<Button
										onClick={handleSendInvites}
										disabled={isLoading}
										className="flex items-center gap-2"
									>
										{isLoading ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
												Sending...
											</>
										) : (
											<>
												<Mail className="h-4 w-4" />
												Send Invites
											</>
										)}
									</Button>
								</div>

								{/* Result Display */}
								{result && (
									<Alert
										variant={result.success ? 'default' : 'destructive'}
										className="mt-4"
									>
										<AlertTitle>
											{result.success ? 'Success!' : 'Error'}
										</AlertTitle>
										<AlertDescription>{result.message}</AlertDescription>
										{result.success && result.results && (
											<div className="mt-2 space-y-1 text-sm">
												<div>
													Successfully sent {result.results.successfulInvites}{' '}
													new invites
												</div>
												{result.results.skippedInvites > 0 && (
													<div className="text-blue-600">
														{result.results.skippedInvites} users already
														invited (skipped)
													</div>
												)}
												{result.results.failedInvites > 0 && (
													<div className="text-yellow-600">
														{result.results.failedInvites} invites failed
													</div>
												)}
											</div>
										)}
									</Alert>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</div>

				<div className="text-muted-foreground text-xs">
					<p>
						<strong>Note:</strong> This will retroactively send calendar
						invitations to past purchasers of this cohort product for any
						associated office hours events. Users already invited will be
						skipped to avoid duplicates.
					</p>
				</div>
			</CardContent>
		</Card>
	)
}
