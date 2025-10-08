import { AuthConfig } from '@auth/core'
import { NodemailerConfig } from '@auth/core/providers/nodemailer'
import { type CoreMessage } from 'ai'
import { CookieSerializeOptions } from 'cookie'
import { Inngest } from 'inngest'
import Stripe from 'stripe'

import { CourseBuilderAdapter } from './adapters'
import {
	CheckoutParams,
	CheckoutParamsSchema,
} from './lib/pricing/stripe-checkout'
import { Cookie } from './lib/utils/cookie'
import { LoggerInstance } from './lib/utils/logger'
import { EmailListConfig, ProviderType, TranscriptionConfig } from './providers'
import {
	Coupon,
	MerchantCoupon,
	Price,
	Product,
	Purchase,
	ResourceProgress,
	User,
	type ContentResource,
} from './schemas'
import { PurchaseInfo } from './schemas/purchase-info'
import { SubscriptionInfo } from './schemas/subscription-info'

export type Awaitable<T> = T | PromiseLike<T>

export interface ResponseInternal<
	Body extends string | Record<string, any> | any[] | null = any,
> {
	status?: number
	headers?: Headers | HeadersInit
	body?: Body
	redirect?: string
	cookies?: Cookie[]
}

export interface CookieOption {
	name: string
	options: CookieSerializeOptions
}

export type CourseBuilderAction =
	| 'webhook'
	| 'srt'
	| 'session'
	| 'subscribe-to-list'
	| 'checkout'
	| 'redeem'
	| 'prices-formatted'
	| 'subscriber'
	| 'purchases'
	| 'lookup'
	| 'claimed'
	| 'nameUpdate'
	| 'transfer'
	| 'refund'
	| 'create-magic-link'

export interface RequestInternal {
	url: URL
	method: 'POST' | 'GET'
	cookies?: Partial<Record<string, string>>
	headers?: Record<string, any>
	query?: Record<string, any>
	body?: Record<string, any>
	action: CourseBuilderAction
	providerId?: string
	error?: string
}

export interface PaymentsProviderConfig {
	id: string
	name: string
	type: 'payment'
	options: PaymentsProviderConsumerConfig
	getBillingPortalUrl: (
		customerId: string,
		returnUrl: string,
	) => Promise<string>
	getSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>
	getSubscriptionInfo: (
		checkoutSessionId: string,
		adapter: CourseBuilderAdapter,
	) => Promise<SubscriptionInfo>
	getPurchaseInfo: (
		checkoutSessionId: string,
		adapter: CourseBuilderAdapter,
	) => Promise<PurchaseInfo>
	createCheckoutSession: (
		checkoutParams: CheckoutParams,
		adapter?: CourseBuilderAdapter,
	) => Promise<{ redirect: string; status: number }>
	refundCharge: (chargeId: string) => Promise<Stripe.Refund>
	getCustomer: (customerId: string) => Promise<Stripe.Customer>
	updateCustomer: (
		customerId: string,
		customer: { name: string; email: string; metadata?: Record<string, any> },
	) => Promise<void>
	getProduct(productId: string): Promise<Stripe.Response<Stripe.Product>>
	getPrice(priceId: string): Promise<Stripe.Response<Stripe.Price>>
	updateProduct<TProductUpdate = Stripe.Product>(
		productId: string,
		productUpdate: Partial<TProductUpdate>,
	): Promise<void>
	updatePrice<TPriceUpdate = Stripe.Price>(
		priceId: string,
		priceUpdate: Partial<TPriceUpdate>,
	): Promise<void>
	createPrice(
		price: Stripe.PriceCreateParams,
	): Promise<Stripe.Response<Stripe.Price>>
	createProduct(
		product: Stripe.ProductCreateParams,
	): Promise<Stripe.Response<Stripe.Product>>
}

export type PaymentsProviderConsumerConfig = Omit<
	Partial<PaymentsProviderConfig>,
	'options' | 'type'
> & {
	paymentsAdapter: PaymentsAdapter
	errorRedirectUrl: string
	cancelUrl: string
	baseSuccessUrl: string
}

export interface PaymentsAdapter {
	/**
	 * Returns the percent off for a given coupon
	 * @param identifier
	 */
	getCouponPercentOff(identifier: string): Promise<number>

	/**
	 * Returns the amount off (in cents) for a given coupon
	 * @param identifier
	 */
	getCouponAmountOff(identifier: string): Promise<number>

	/**
	 * Returns a coupon id.
	 *
	 * TODO: these use the stripe types and we probably want to use an
	 *   internal interface so that we can think about different providers
	 *   in the future.
	 * @param params
	 */
	createCoupon(params: Stripe.CouponCreateParams): Promise<string>

	/**
	 * Returns a promotion code.
	 * @param params
	 */
	createPromotionCode(params: Stripe.PromotionCodeCreateParams): Promise<string>

	/**
	 * Returns the URL to redirect to for a checkout session.
	 * @param params
	 */
	createCheckoutSession(
		params: Stripe.Checkout.SessionCreateParams,
	): Promise<string | null>

	getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>

	createCustomer(params: Stripe.CustomerCreateParams): Promise<string>
	verifyWebhookSignature(rawBody: string, sig: string): Promise<boolean>
	getCustomer(customerId: string): Promise<Stripe.Customer>
	updateCustomer(
		customerId: string,
		customer: { name: string; email: string; metadata?: Record<string, any> },
	): Promise<void>
	refundCharge(chargeId: string): Promise<Stripe.Refund>
	getProduct(productId: string): Promise<Stripe.Response<Stripe.Product>>
	getPrice(priceId: string): Promise<Stripe.Response<Stripe.Price>>
	updateProduct<TProductUpdate = Stripe.Product>(
		productId: string,
		product: Partial<TProductUpdate>,
	): Promise<void>
	updatePrice<TPriceUpdate = Stripe.Price>(
		priceId: string,
		priceUpdate: Partial<TPriceUpdate>,
	): Promise<void>
	createPrice(
		price: Stripe.PriceCreateParams,
	): Promise<Stripe.Response<Stripe.Price>>
	createProduct(
		product: Stripe.ProductCreateParams,
	): Promise<Stripe.Response<Stripe.Product>>
	getSubscription(subscriptionId: string): Promise<Stripe.Subscription>
	getBillingPortalUrl(customerId: string, returnUrl: string): Promise<string>
}

export type InternalProvider<T = ProviderType> = T extends 'transcription'
	? TranscriptionConfig
	: T extends 'email-list'
		? EmailListConfig
		: T extends 'payment'
			? PaymentsProviderConfig
			: T extends 'email'
				? NodemailerConfig
				: never

export interface InternalOptions<TProviderType = ProviderType> {
	providers: InternalProvider[]
	url: URL
	action: CourseBuilderAction
	provider: InternalProvider<TProviderType>
	debug: boolean
	logger: LoggerInstance
	adapter: Required<CourseBuilderAdapter> | undefined
	cookies: Record<keyof CookiesOptions, CookieOption>
	basePath: string
	inngest: Inngest
	callbacks: CallbacksOptions
	getCurrentUser?: () => Promise<User | null>
	authConfig: AuthConfig
	baseUrl: string
}

export interface CookieOption {
	name: string
	options: CookieSerializeOptions
}

export interface CookiesOptions {
	ck_subscriber_id?: Partial<CookieOption>
}

export interface DefaultCourseBuilderSession {}

export interface CourseBuilderSession extends DefaultCourseBuilderSession {}

export interface CallbacksOptions {
	session: (
		params: any,
	) => Awaitable<CourseBuilderSession | DefaultCourseBuilderSession>
}

export type FunctionCall = {
	arguments: Record<string, any>
	name: string // function name.
}

export type AIMessage = CoreMessage & {
	createdAt?: Date
	id?: string
}

export type AIError = { error: string }

export type AIOutput = AIMessage | AIError

export interface ProgressWriter {
	writeResponseInChunks(
		streamingResponse: Response | ReadableStream,
	): Promise<AIOutput>
	publishMessage(message: string): Promise<void>
}

type MerchantCouponWithCountry = MerchantCoupon & {
	country?: string | undefined
}

export type MinimalMerchantCoupon = Omit<
	MerchantCouponWithCountry,
	'identifier' | 'merchantAccountId'
>

type ProductWithPrices = Product & { prices?: Price[] }

export type FormattedPrice = {
	id: string
	quantity: number
	unitPrice: number
	fullPrice: number
	fixedDiscountForUpgrade: number
	calculatedPrice: number
	availableCoupons: Array<
		Omit<MerchantCouponWithCountry, 'identifier'> | undefined
	>
	appliedMerchantCoupon?: MinimalMerchantCoupon
	appliedDiscountType?: 'ppp' | 'bulk' | 'fixed' | 'percentage' | 'none'
	upgradeFromPurchaseId?: string
	upgradeFromPurchase?: Purchase
	upgradedProduct?: ProductWithPrices | null
	bulk: boolean
	usedCouponId?: string
	usedCoupon?: Coupon | null
	defaultCoupon?: Coupon | null
}

export type FormatPricesForProductOptions = {
	productId?: string
	country?: string
	quantity?: number
	merchantCouponId?: string
	ctx: CourseBuilderAdapter
	upgradeFromPurchaseId?: string
	userId?: string
	autoApplyPPP?: boolean
	usedCouponId?: string
}

export type CommerceProps = {
	couponIdFromCoupon?: string
	couponFromCode?: CouponForCode
	userId?: string
	purchases?: Purchase[]
	products?: Product[]
	allowPurchase?: boolean
	country?: string
}

export type CouponForCode = Coupon & {
	isValid: boolean
	isRedeemable: boolean
}

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export type PricingOptions = {
	withImage: boolean
	withTitle: boolean
	withGuaranteeBadge: boolean
	isLiveEvent: boolean
	isCohort: boolean
	isPPPEnabled: boolean
	teamQuantityLimit: number
	allowTeamPurchase: boolean
	cancelUrl: string
}

export { CheckoutParamsSchema, type CheckoutParams }
