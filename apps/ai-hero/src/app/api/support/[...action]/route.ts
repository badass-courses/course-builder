import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env.mjs'
import { withSkill } from '@/server/with-skill'
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
export const POST = withSkill(async (request: NextRequest) => {
	// Check at request time, not build time
	if (!env.SUPPORT_WEBHOOK_SECRET) {
		return NextResponse.json(
			{ error: 'Support integration not configured' },
			{ status: 503 },
		)
	}

	const handler = createSupportHandler({
		integration,
		webhookSecret: env.SUPPORT_WEBHOOK_SECRET,
	})

	return handler(request)
})
