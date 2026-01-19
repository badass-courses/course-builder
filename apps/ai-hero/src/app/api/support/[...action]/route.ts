import { env } from '@/env.mjs'
import { createSupportHandler } from '@skillrecordings/sdk/handler'

import { integration } from '../integration'

/**
 * Support Platform API Handler
 *
 * Handles requests from the Skill Recordings support platform:
 * - lookupUser: Find user by email
 * - getPurchases: Get user's purchase history
 * - revokeAccess: Revoke access after refund
 * - transferPurchase: Transfer license to new owner
 * - generateMagicLink: Create passwordless login link
 * - updateEmail: Change user's email
 * - updateName: Change user's display name
 *
 * All requests are authenticated via HMAC-SHA256 signature.
 */
const handler = createSupportHandler({
	integration,
	webhookSecret: env.SUPPORT_WEBHOOK_SECRET,
})

export { handler as POST }
