import { and, assign, fromPromise, setup } from 'xstate'

import { MerchantCoupon, Product } from '@coursebuilder/core/schemas'
import { FormattedPrice } from '@coursebuilder/core/types'

import { PricingOptions } from './pricing-props'

export type PricingContextType = {
	product: Product
	formattedPrice: FormattedPrice | null
	quantity: number
	isPPPActive: boolean
	isTeamPurchaseActive: boolean
	couponId: string | null | undefined
	activeMerchantCoupon: MerchantCoupon | null | undefined
	autoApplyPPP: boolean
	isBuyingMoreSeats: boolean
	options: PricingOptions
}

export type PricingMachineInput = {
	product: Product
	quantity?: number
	couponId?: string | null
	autoApplyPPP?: boolean
	options?: PricingOptions
}

const defaultPricingOptions = {
	withImage: true,
	withGuaranteeBadge: true,
	isLiveEvent: false,
	isPPPEnabled: true,
	teamQuantityLimit: 100,
	allowTeamPurchase: true,
}

export const pricingMachine = setup({
	types: {
		context: {} as PricingContextType,
		input: {} as PricingMachineInput,
		events: {} as
			| { type: 'UPDATE_QUANTITY'; quantity: number }
			| { type: 'PRICING_DATA_LOADED' }
			| { type: 'TOGGLE_TEAM_PURCHASE' }
			| { type: 'TOGGLE_BUYING_MORE_SEATS' }
			| { type: 'PURCHASE_INITIATED' }
			| { type: 'SET_MERCHANT_COUPON'; merchantCoupon?: MerchantCoupon },
	},
	actors: {
		loadFormattedPrices: fromPromise<
			FormattedPrice | null,
			{
				productId: string
				quantity?: number
				couponId?: string
				merchantCoupon?: MerchantCoupon
				autoApplyPPP?: boolean
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
						autoApplyPPP: input.autoApplyPPP || true,
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
		formattedPrice: null,
		quantity: input.quantity || 1,
		isPPPActive: false,
		isTeamPurchaseActive: false,
		couponId: input.couponId || null,
		activeMerchantCoupon: null,
		autoApplyPPP: input.autoApplyPPP || true,
		isBuyingMoreSeats: false,
		options: input.options
			? { ...defaultPricingOptions, ...input.options }
			: defaultPricingOptions,
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
						autoApplyPPP,
					},
				}: any) => ({
					productId: product.id,
					quantity,
					couponId,
					country,
					merchantCoupon: activeMerchantCoupon,
					autoApplyPPP,
				}),
				src: 'loadFormattedPrices',
				onDone: {
					target: 'Ready To Buy',
					actions: assign({
						formattedPrice: ({ event }) => event.output,
					}),
				},
			},
			on: {
				UPDATE_QUANTITY: {
					target: 'Debouncing Quantity',
					actions: assign({
						quantity: ({ event }) => Math.max(event.quantity, 1),
					}),
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
					actions: assign({
						quantity: ({ event }) => Math.max(event.quantity, 1),
					}),
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
				TOGGLE_BUYING_MORE_SEATS: {
					actions: assign({
						isBuyingMoreSeats: ({ context }) => !context.isBuyingMoreSeats,
					}),
				},
				SET_MERCHANT_COUPON: {
					target: 'Loading Pricing Data',
					actions: assign({
						activeMerchantCoupon: ({ event }) => event.merchantCoupon,
						autoApplyPPP: false,
						isTeamPurchaseActive: false,
						quantity: 1,
					}),
				},
				UPDATE_QUANTITY: {
					target: 'Debouncing Quantity',
					actions: assign({
						quantity: ({ event }) => Math.max(event.quantity, 1),
					}),
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
