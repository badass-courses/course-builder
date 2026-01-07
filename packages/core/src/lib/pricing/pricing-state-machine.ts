import { and, assign, fromPromise, setup } from 'xstate'

import { MerchantCoupon, Product, type Purchase } from '../../schemas'
import { FormattedPrice, PricingData, PricingOptions } from '../../types'

export type PricingContextType = {
	product: Product
	formattedPrice: FormattedPrice | null
	quantity: number
	isPPPActive: boolean
	isTeamPurchaseActive: boolean
	isCohort: boolean
	couponId: string | null | undefined
	activeMerchantCoupon: MerchantCoupon | null | undefined
	autoApplyPPP: boolean
	isBuyingMoreSeats: boolean
	options: PricingOptions
	userId: string | undefined
	isPreviouslyPurchased: boolean
	purchases?: Purchase[] | null
	allowPurchase: boolean
	pricingData: PricingData
	organizationId?: string | undefined
}

export type PricingMachineInput = {
	product: Product
	quantity?: number
	couponId?: string | null
	autoApplyPPP?: boolean
	options?: Partial<PricingOptions>
	userId?: string | undefined
	pricingDataLoader: Promise<PricingData>
	allowPurchase?: boolean
	quantityAvailable?: number
	pricingData?: PricingData
	organizationId?: string | undefined
}

export const defaultPricingOptions = {
	withImage: true,
	withTitle: true,
	withGuaranteeBadge: true,
	isLiveEvent: false,
	isCohort: false,
	isPPPEnabled: true,
	teamQuantityLimit: 100,
	allowTeamPurchase: true,
	cancelUrl: `${process.env.NEXT_PUBLIC_URL}/`,
}

export const pricingMachine = setup({
	types: {
		context: {} as PricingContextType,
		input: {} as PricingMachineInput,
		events: {} as
			| { type: 'UPDATE_QUANTITY'; quantity: number }
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
						autoApplyPPP: input.autoApplyPPP || false,
					}),
				},
			).then(async (res) => {
				return ((await res.json()) as FormattedPrice) || null
			})
		}),
		loadPurchases: fromPromise<
			{
				isPreviouslyPurchased: boolean
				purchases?: Purchase[]
			},
			{ userId: string; productId: string }
		>(async ({ input }) => {
			if (!input.userId) {
				return Promise.resolve({
					isPreviouslyPurchased: false,
				})
			}
			return await fetch(
				`${process.env.NEXT_PUBLIC_URL}/api/coursebuilder/purchases?userId=${input.userId}`,
			)
				.then(async (res) => {
					const userPurchases = (await res.json()) as Purchase[] | null

					if (userPurchases?.length === 0)
						return {
							isPreviouslyPurchased: false,
						}

					const purchasesForProduct = userPurchases?.filter(
						(purchase) =>
							purchase?.product?.id === input.productId &&
							purchase?.status === 'Valid',
					)

					if (purchasesForProduct && purchasesForProduct.length > 0) {
						return {
							isPreviouslyPurchased: true,
							purchases: purchasesForProduct,
						}
					} else {
						return {
							isPreviouslyPurchased: false,
						}
					}
				})
				.catch((e) => {
					console.error('Error loading purchases', e)
					return {
						isPreviouslyPurchased: false,
					}
				})
		}),
	},
	guards: {
		canToggleTeamPurchase: function ({ context, event }) {
			console.log('GUARD!', context.isPPPActive)
			return !context.isPPPActive
		},
		isPPPAvailable: function ({ context, event }) {
			return Boolean(
				Array.isArray(context.formattedPrice?.availableCoupons) &&
					context.formattedPrice.availableCoupons.some(
						(coupon) => coupon?.type === 'ppp',
					),
			)
		},
		canUpdateQuantity: and([
			({ context, event }) => {
				return (
					(context.isTeamPurchaseActive && !context.isPPPActive) ||
					context.isBuyingMoreSeats
				)
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
		isCohort: input.product.type === 'cohort',
		couponId: input.couponId || null,
		activeMerchantCoupon: null,
		autoApplyPPP: input.autoApplyPPP || false,
		isBuyingMoreSeats: false,
		options: input.options
			? { ...defaultPricingOptions, ...input.options }
			: defaultPricingOptions,
		userId: input.userId,
		isPreviouslyPurchased: false,
		allowPurchase: true,
		pricingData: input.pricingData || {
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		},
		purchases: null,
		organizationId: input.organizationId,
	}),
	id: 'Pricing Display',
	initial: 'Loading Pricing Data',
	states: {
		'Loading Pricing Data': {
			invoke: [
				{
					id: 'load-purchases',
					src: 'loadPurchases',
					input: ({ context }: any) => ({
						userId: context.userId,
						productId: context.product.id,
					}),
					onDone: {
						actions: assign({
							isPreviouslyPurchased: ({ event }) =>
								event.output.isPreviouslyPurchased,
							purchases: ({ event }) => event.output.purchases,
						}),
					},
				},
				{
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
			],
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
						assign({
							activeMerchantCoupon: undefined,
							isPPPActive: false,
							isTeamPurchaseActive: ({ context }) =>
								!context.isTeamPurchaseActive,
							quantity: ({ context }) => {
								if (context.isTeamPurchaseActive) {
									return 1
								} else {
									const defaultTeamSize = 5

									if (context.options.isLiveEvent) {
										if (context.pricingData.quantityAvailable === -1) {
											return defaultTeamSize
										} else {
											return Math.max(
												1,
												Math.min(
													context.pricingData.quantityAvailable,
													defaultTeamSize,
												),
											)
										}
									} else {
										return Math.min(
											context.options.teamQuantityLimit,
											defaultTeamSize,
										)
									}
								}
							},
						}),
					],
					guard: {
						type: 'canToggleTeamPurchase',
					},
				},
				TOGGLE_BUYING_MORE_SEATS: {
					actions: assign({
						isBuyingMoreSeats: ({ context }) => !context.isBuyingMoreSeats,
						isTeamPurchaseActive: () => true,
					}),
				},
				SET_MERCHANT_COUPON: {
					target: 'Loading Pricing Data',
					actions: assign({
						activeMerchantCoupon: ({ event }) => event.merchantCoupon,
						autoApplyPPP: false,
						isPPPActive: ({ event }) => event.merchantCoupon?.type === 'ppp',
						isTeamPurchaseActive: ({ event, context }) =>
							event.merchantCoupon?.type === 'ppp'
								? false
								: context.isTeamPurchaseActive,
						quantity: ({ context, event }) =>
							event.merchantCoupon?.type === 'ppp' ? 1 : context.quantity,
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
