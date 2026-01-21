/** Cookie name for tracking subscriber status */
export const SUBSCRIBER_COOKIE_NAME = 'cb_subscriber'

/**
 * Subscriber data stored in cookie
 */
export type SubscriberCookie = {
	email: string
	subscribedAt: string
}
