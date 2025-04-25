export const EMAIL_SEND_BROADCAST = 'email/send-broadcast'

export type EmailSendBroadcast = {
	name: typeof EMAIL_SEND_BROADCAST
	data: {
		toUserId: string
	}
}
