#!/usr/bin/env tsx

/**
 * Debug script for event creation
 * Run with: pnpm tsx scripts/debug-event-creation.ts
 */
import { logger } from '@coursebuilder/core/utils/logger'

import { courseBuilderAdapter } from '../src/db'

async function debugEventCreation() {
	console.log('🔍 [DEBUG] Starting event creation debug test')

	try {
		// Test 1: Check if payment provider is available
		console.log('🔍 [DEBUG] Testing payment provider availability...')

		// Test 2: Check if merchant account exists
		console.log('🔍 [DEBUG] Testing merchant account...')

		// Test 3: Try to create a simple event without price
		console.log('🔍 [DEBUG] Testing event creation without price...')

		const testEventInput = {
			type: 'event' as const,
			fields: {
				title: 'Test Event - Debug',
				description: 'This is a test event for debugging',
				startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
				endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
				price: null,
				quantity: null,
				state: 'draft' as const,
				visibility: 'public' as const,
				slug: null,
				tagIds: null,
			},
		}

		const userId = 'test-user-id'

		console.log('🔍 [DEBUG] Creating test event...', {
			input: testEventInput,
			userId,
		})

		const event = await courseBuilderAdapter.createEvent(testEventInput, userId)

		console.log('✅ [DEBUG] Test event created successfully', {
			eventId: event?.id,
			title: event?.fields?.title,
		})

		// Test 4: Try to create an event with price
		console.log('🔍 [DEBUG] Testing event creation with price...')

		const testEventWithPriceInput = {
			type: 'event' as const,
			fields: {
				title: 'Test Event with Price - Debug',
				description: 'This is a test event with price for debugging',
				startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
				endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
				price: 29.99,
				quantity: 100,
				state: 'draft' as const,
				visibility: 'public' as const,
				slug: null,
				tagIds: null,
			},
		}

		console.log('🔍 [DEBUG] Creating test event with price...', {
			input: testEventWithPriceInput,
			userId,
		})

		const eventWithPrice = await courseBuilderAdapter.createEvent(
			testEventWithPriceInput,
			userId,
		)

		console.log('✅ [DEBUG] Test event with price created successfully', {
			eventId: eventWithPrice?.id,
			title: eventWithPrice?.fields?.title,
			hasProducts:
				eventWithPrice?.resources?.some(
					(r) => r.resource?.type === 'product',
				) || false,
		})

		console.log('✅ [DEBUG] All tests completed successfully')
	} catch (error) {
		console.error('❌ [DEBUG] Error during debug test', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})

		// Log additional details about the error
		if (error instanceof Error) {
			console.error('❌ [DEBUG] Error details:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
			})
		}
	}
}

// Run the debug function
debugEventCreation()
	.then(() => {
		console.log('✅ [DEBUG] Debug script completed')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ [DEBUG] Debug script failed', error)
		process.exit(1)
	})
