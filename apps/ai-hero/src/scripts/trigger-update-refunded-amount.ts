/**
 * This script triggers the update refunded amount workflow
 * It will find all eligible purchases and update their totalAmount
 * to reflect the actual amount after the $20 partial refund
 *
 * Usage:
 * pnpm tsx apps/ai-hero/src/scripts/trigger-update-refunded-amount.ts
 */

import { inngest } from '@/inngest/inngest.server'

async function main() {
	console.log('🚀 Triggering update refunded amount workflow...')

	const result = await inngest.send({
		name: 'admin.update.refunded_amount',
		data: {},
	})

	console.log('✅ Workflow triggered successfully!')
	console.log('Result:', JSON.stringify(result, null, 2))
}

main()
	.then(() => {
		console.log('✅ Done!')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ Error:', error)
		process.exit(1)
	})
