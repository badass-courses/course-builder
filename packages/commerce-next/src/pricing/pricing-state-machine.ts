import { and, assign, fromPromise, setup } from 'xstate'

import { MerchantCoupon, Product } from '@coursebuilder/core/schemas'
import { FormattedPrice } from '@coursebuilder/core/types'

export const pricingMachine = setup({
	types: {
		context: {} as {
			product: Product
			pricingData: FormattedPrice | null
			quantity: number
			isPPPActive: boolean
			isTeamPurchaseActive: boolean
			couponId: string | null
			country: string
			activeMerchantCoupon: MerchantCoupon | null | undefined
		},
		input: {} as {
			product: Product
			quantity?: number
			couponId?: string | null
			country?: string
		},
		events: {} as
			| { type: 'TOGGLE_PPP' }
			| { type: 'UPDATE_QUANTITY'; quantity: number }
			| { type: 'PRICING_DATA_LOADED' }
			| { type: 'TOGGLE_TEAM_PURCHASE' }
			| { type: 'PURCHASE_INITIATED' }
			| { type: 'SET_MERCHANT_COUPON'; merchantCoupon?: MerchantCoupon },
	},
	actors: {
		loadFormattedProcess: fromPromise<
			FormattedPrice | null,
			{
				productId: string
				quantity?: number
				couponId?: string
				merchantCoupon?: MerchantCoupon
				autoApplyPPP?: boolean
				country?: string
			}
		>(async ({ input }) => {
			if (!input) return Promise.resolve(null)
			return await fetch(
				`${process.env.NEXT_PUBLIC_URL}/api/coursebuilder/prices-formatted`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						productId: input.productId,
						quantity: input.quantity || 1,
						couponId: input.couponId,
						merchantCoupon: input.merchantCoupon,
						autoApplyPPP: input.autoApplyPPP || false,
						country: input.country || 'US',
					}),
				},
			).then(async (res) => {
				return ((await res.json()) as FormattedPrice) || null
			})
		}),
	},
	guards: {
		canToggleTeamPurchase: function ({ context, event }) {
			// Add your guard condition here
			return true
		},
		isPPPAvailable: function ({ context, event }) {
			// Add your guard condition here
			return true
		},
		canUpdateQuantity: and([
			({ context, event }) => {
				// Add a guard condition here
				return true
			},
			({ context, event }) => {
				// Add another guard condition here
				return true
			},
		]),
	},
}).createMachine({
	context: ({ input }) => ({
		product: input.product,
		pricingData: null,
		quantity: input.quantity || 1,
		isPPPActive: false,
		isTeamPurchaseActive: false,
		couponId: input.couponId || null,
		country: input.country || 'US',
		activeMerchantCoupon: null,
	}),
	id: 'Pricing Display',
	initial: 'Loading Pricing Data',
	states: {
		'Loading Pricing Data': {
			invoke: {
				id: 'load-prices',
				input: ({
					context: {
						product,
						quantity,
						couponId,
						country,
						activeMerchantCoupon,
					},
				}: any) => ({
					productId: product.id,
					quantity,
					couponId,
					country,
					merchantCoupon: activeMerchantCoupon,
				}),
				src: 'loadFormattedProcess',
				onDone: {
					target: 'Ready To Buy',
					actions: assign({ pricingData: ({ event }) => event.output }),
				},
			},
			on: {
				UPDATE_QUANTITY: {
					target: 'Debouncing Quantity',
					actions: assign({ quantity: ({ event }) => event.quantity }),
					guard: {
						type: 'canUpdateQuantity',
					},
				},
			},
		},
		'Debouncing Quantity': {
			after: {
				350: {
					target: 'Loading Pricing Data',
				},
			},
			on: {
				UPDATE_QUANTITY: {
					target: 'Debouncing Quantity',
					actions: assign({ quantity: ({ event }) => event.quantity }),
					guard: {
						type: 'canUpdateQuantity',
					},
				},
			},
		},
		'Ready To Buy': {
			on: {
				TOGGLE_TEAM_PURCHASE: {
					target: 'Loading Pricing Data',
					actions: [
						assign({ isPPPActive: false }),
						assign({
							isTeamPurchaseActive: ({ context }) =>
								!context.isTeamPurchaseActive,
							quantity: ({ context }) => (context.isTeamPurchaseActive ? 1 : 5),
						}),
					],
					guard: {
						type: 'canToggleTeamPurchase',
					},
				},
				TOGGLE_PPP: {
					target: 'Loading Pricing Data',
					actions: assign({
						isPPPActive: ({ context }) => !context.isPPPActive,
					}),
					guard: {
						type: 'isPPPAvailable',
					},
				},
				SET_MERCHANT_COUPON: {
					target: 'Loading Pricing Data',
					actions: assign({
						activeMerchantCoupon: ({ event }) => event.merchantCoupon,
					}),
					guard: {
						type: 'isPPPAvailable',
					},
				},
				UPDATE_QUANTITY: {
					target: 'Debouncing Quantity',
					actions: assign({ quantity: ({ event }) => event.quantity }),
					guard: {
						type: 'canUpdateQuantity',
					},
				},
				PURCHASE_INITIATED: {
					target: 'Purchasing',
				},
			},
		},
		Purchasing: {
			type: 'final',
		},
	},
})
