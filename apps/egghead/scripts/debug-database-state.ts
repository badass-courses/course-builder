#!/usr/bin/env tsx

/**
 * Debug script for checking database state
 * Run with: pnpm tsx scripts/debug-database-state.ts
 */
import { stripeProvider } from '../src/coursebuilder/stripe-provider'
import { db } from '../src/db'
import { env } from '../src/env.mjs'

async function debugDatabaseState() {
	console.log('🔍 [DEBUG] Starting database state check')

	try {
		// Check 1: Environment variables
		console.log('🔍 [DEBUG] Checking environment variables...')
		console.log(
			'✅ [DEBUG] STRIPE_SECRET_TOKEN:',
			env.STRIPE_SECRET_TOKEN ? 'Set' : 'Not set',
		)
		console.log(
			'✅ [DEBUG] STRIPE_WEBHOOK_SECRET:',
			env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set',
		)

		// Check 2: Stripe provider
		console.log('🔍 [DEBUG] Checking Stripe provider...')
		console.log('✅ [DEBUG] Stripe provider configured:', !!stripeProvider)

		// Check 3: Merchant accounts
		console.log('🔍 [DEBUG] Checking merchant accounts...')
		const merchantAccounts = await db.query.merchantAccount.findMany({
			where: (merchantAccount, { eq }) => eq(merchantAccount.label, 'stripe'),
		})

		console.log('✅ [DEBUG] Merchant accounts found:', merchantAccounts.length)
		merchantAccounts.forEach((account, index) => {
			console.log(
				`  ${index + 1}. ID: ${account.id}, Label: ${account.label}, Status: ${account.status}`,
			)
		})

		// Check 4: Recent events
		console.log('🔍 [DEBUG] Checking recent events...')
		const recentEvents = await db.query.contentResource.findMany({
			where: (contentResource, { eq }) => eq(contentResource.type, 'event'),
			orderBy: (contentResource, { desc }) => desc(contentResource.createdAt),
			limit: 5,
		})

		console.log('✅ [DEBUG] Recent events found:', recentEvents.length)
		recentEvents.forEach((event, index) => {
			console.log(
				`  ${index + 1}. ID: ${event.id}, Title: ${event.fields?.title}, Created: ${event.createdAt}`,
			)
		})

		// Check 5: Recent products
		console.log('🔍 [DEBUG] Checking recent products...')
		const recentProducts = await db.query.products.findMany({
			orderBy: (products, { desc }) => desc(products.createdAt),
			limit: 5,
		})

		console.log('✅ [DEBUG] Recent products found:', recentProducts.length)
		recentProducts.forEach((product, index) => {
			console.log(
				`  ${index + 1}. ID: ${product.id}, Name: ${product.name}, Type: ${product.type}`,
			)
		})

		// Check 6: Recent prices
		console.log('🔍 [DEBUG] Checking recent prices...')
		const recentPrices = await db.query.prices.findMany({
			orderBy: (prices, { desc }) => desc(prices.createdAt),
			limit: 5,
		})

		console.log('✅ [DEBUG] Recent prices found:', recentPrices.length)
		recentPrices.forEach((price, index) => {
			console.log(
				`  ${index + 1}. ID: ${price.id}, Product ID: ${price.productId}, Amount: ${price.unitAmount}`,
			)
		})

		console.log('✅ [DEBUG] Database state check completed')
	} catch (error) {
		console.error('❌ [DEBUG] Error during database state check', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
	}
}

// Run the debug function
debugDatabaseState()
	.then(() => {
		console.log('✅ [DEBUG] Database state check script completed')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ [DEBUG] Database state check script failed', error)
		process.exit(1)
	})
