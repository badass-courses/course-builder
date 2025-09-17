export const BULK_CALENDAR_INVITE_EVENT = 'calendar/bulk-invite-requested'

export type BulkCalendarInviteSent = {
	name: typeof BULK_CALENDAR_INVITE_EVENT
	data: {
		productId: string
		requestedBy: {
			id: string
			email: string
		}
	}
}
