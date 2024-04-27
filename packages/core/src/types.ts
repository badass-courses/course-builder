import { CookieSerializeOptions } from 'cookie'
import { Inngest } from 'inngest'
import { type ChatCompletionRequestMessage } from 'openai-edge'
import Stripe from 'stripe'
import { z } from 'zod'

import { CourseBuilderAdapter } from './adapters'
import { CheckoutParams } from './lib/pricing/stripe-checkout'
import { Cookie } from './lib/utils/cookie'
import { LoggerInstance } from './lib/utils/logger'
import { EmailListConfig, ProviderType, TranscriptionConfig } from './providers'
import {
	Coupon,
	MerchantCoupon,
	Price,
	Product,
	Purchase,
	User,
} from './schemas'
import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from './schemas/content-resource-schema'
import { PurchaseInfo } from './schemas/purchase-info'

export type Awaitable<T> = T | PromiseLike<T>

export type ContentResource = z.infer<typeof ContentResourceSchema> & {
	resources?: ContentResourceResource[] | null
}
export type ContentResourceResource = z.infer<
	typeof ContentResourceResourceSchema
> & {
	resource?: ContentResource | null
}

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
	getPurchaseInfo: (
		checkoutSessionId: string,
		adapter: CourseBuilderAdapter,
	) => Promise<PurchaseInfo>
	createCheckoutSession: (
		checkoutParams: CheckoutParams,
		adapter?: CourseBuilderAdapter,
	) => Promise<{ redirect: string; status: number }>
	getCustomer: (customerId: string) => Promise<Stripe.Customer>
	updateCustomer: (
		customerId: string,
		customer: { name: string; email: string },
	) => Promise<void>
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
		customer: { name: string; email: string },
	): Promise<void>
}

export type InternalProvider<T = ProviderType> = T extends 'transcription'
	? TranscriptionConfig
	: T extends 'email-list'
		? EmailListConfig
		: T extends 'payment'
			? PaymentsProviderConfig
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
}

export interface CookieOption {
	name: string
	options: CookieSerializeOptions
}

export interface CookiesOptions {}

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

export type AIMessage = ChatCompletionRequestMessage & {
	content: null | string
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
	upgradeFromPurchaseId?: string
	upgradeFromPurchase?: Purchase
	upgradedProduct?: ProductWithPrices | null
	bulk: boolean
	usedCouponId?: string
	defaultCoupon?: Coupon | null
}
