// This work is needed as workaround to Drizzle truncating millisecond precision.
// https://github.com/drizzle-team/drizzle-orm/pull/668

import { randomUUID } from 'utils/adapter.js'

import { Product, purchaseSchema } from '@coursebuilder/core/schemas'

const emailVerified = new Date()
emailVerified.setMilliseconds(0)

const createdAt = new Date()
createdAt.setMilliseconds(0)

const ONE_WEEK_FROM_NOW = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
ONE_WEEK_FROM_NOW.setMilliseconds(0)
const FIFTEEN_MINUTES_FROM_NOW = new Date(Date.now() + 15 * 60 * 1000)
FIFTEEN_MINUTES_FROM_NOW.setMilliseconds(0)

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30
const ONE_MONTH_FROM_NOW = new Date(Date.now() + ONE_MONTH)
ONE_MONTH_FROM_NOW.setMilliseconds(0)

const userId = randomUUID()

const UPGRADE_PURCHASE_ID = 'upgrade-product-id'
const DEFAULT_PRODUCT_ID = randomUUID()
const UPGRADE_PRODUCT_ID = randomUUID()
const VALID_INDIA_COUPON_ID = 'valid-india-coupon-id'
const SITE_SALE_COUPON_ID = randomUUID()
const LARGE_SITE_SALE_COUPON_ID = 'valid-jumbo-coupon-id'
const ORIGINAL_PPP_PURCHASE_ID = 'original-ppp-purchase-id'
const UPGRADED_PPP_PURCHASE_ID = 'upgraded-ppp-purchase-id'

const mockProduct: Product = {
	id: DEFAULT_PRODUCT_ID,
	type: 'self-paced',
	name: 'professional',
	createdAt: new Date(),
	key: 'hey',
	status: 1,
	quantityAvailable: -1,
	fields: {
		slug: 'professional',
		state: 'published',
		visibility: 'public',
		action: 'Buy Now',
	},
	resources: [],
}

const mockUpgradeProduct: Product = {
	id: UPGRADE_PRODUCT_ID,
	type: 'self-paced',
	name: 'professional',
	createdAt: new Date(),
	key: 'hey',
	status: 1,
	quantityAvailable: -1,
	fields: {
		slug: 'super-professional',
		state: 'published',
		visibility: 'public',
		action: 'Buy Now',
	},
	resources: [],
}

const mockPrice = {
	id: 'price-id',
	createdAt: new Date(),
	status: 1,
	productId: DEFAULT_PRODUCT_ID,
	nickname: 'bah',
	unitAmount: 100,
}

const mockUpgradePrice = {
	id: 'price-id',
	createdAt: new Date(),
	status: 1,
	productId: UPGRADE_PRODUCT_ID,
	nickname: 'bah',
	unitAmount: 180,
}

const MOCK_SITE_SALE_COUPON = {
	id: SITE_SALE_COUPON_ID,
	type: 'special',
	percentageDiscount: '0.2',
	identifier: 'coupon',
	status: 1,
	merchantAccountId: 'merchant-account',
}

const MOCK_LARGE_SITE_SALE_COUPON = {
	id: LARGE_SITE_SALE_COUPON_ID,
	type: 'special',
	percentageDiscount: 0.8,
	identifier: 'coupon',
	status: 1,
	merchantAccountId: 'merchant-account',
}

const MOCK_INDIA_COUPON = {
	id: VALID_INDIA_COUPON_ID,
	type: 'ppp',
	percentageDiscount: 0.75,
	identifier: 'coupon',
	status: 1,
	merchantAccountId: 'merchant-account',
}

export const fixtures = {
	product: mockProduct,
	upgradeProduct: mockUpgradeProduct,
	price: mockPrice,
	upgradePrice: mockUpgradePrice,
	coupon: MOCK_SITE_SALE_COUPON,
	largeCoupon: MOCK_LARGE_SITE_SALE_COUPON,
	indiaCoupon: MOCK_INDIA_COUPON,
	user: {
		id: userId,
		email: 'fill@murray.com',
		image: 'https://www.fillmurray.com/460/300',
		name: 'Fill Murray',
		role: 'user',
		emailVerified,
		createdAt,
	},
	purchase: purchaseSchema.parse({
		id: randomUUID(),
		userId,
		createdAt: createdAt,
		totalAmount: 123,
		ipAddress: '127.0.0.1',
		couponId: randomUUID(),
		productId: randomUUID(),
		merchantChargeId: randomUUID(),
		merchantSessionId: randomUUID(),
		purchasedAt: new Date(),
		status: 'Valid',
		type: 'Valid',
	}),
	session: {
		sessionToken: randomUUID(),
		expires: ONE_WEEK_FROM_NOW,
	},
	sessionUpdateExpires: ONE_MONTH_FROM_NOW,
	verificationTokenExpires: FIFTEEN_MINUTES_FROM_NOW,
	account: {
		provider: 'github',
		providerAccountId: randomUUID(),
		type: 'oauth',
		access_token: randomUUID(),
		expires_at: ONE_MONTH / 1000,
		id_token: randomUUID(),
		refresh_token: randomUUID(),
		token_type: 'bearer',
		scope: 'user',
		session_state: randomUUID(),
		oauth_token: null,
		oauth_token_secret: null,
		refresh_token_expires_in: null,
	},
	createdAt,
	standardMerchantCoupons: [
		{
			id: '3e57b4a77429',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: '8M0LQt2k',
			percentageDiscount: '0.45',
			type: 'bulk',
		},
		{
			id: 'b59e830b5a1a',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'CDDkwbeB',
			percentageDiscount: '0.35',
			type: 'bulk',
		},
		{
			id: 'f42465e8bc93',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'DM81Y6XH',
			percentageDiscount: '0.25',
			type: 'bulk',
		},
		{
			id: 'c0c276055301',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'lyu3E7Cp',
			percentageDiscount: '0.15',
			type: 'bulk',
		},
		{
			id: '698e5e68de49',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'MXQXifFw',
			percentageDiscount: '0.1',
			type: 'bulk',
		},
		{
			id: '51aee1f9aa76',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'HSxsmB03',
			percentageDiscount: '0.05',
			type: 'bulk',
		},
		{
			id: '433ff85941d6',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: '8Zt8gXNR',
			percentageDiscount: '0.95',
			type: 'special',
		},
		{
			id: '3d7923347ea5',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'ls8xRtqQ',
			percentageDiscount: '0.9',
			type: 'special',
		},
		{
			id: '4e8afa9b2690',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'OoxAUXIT',
			percentageDiscount: '0.75',
			type: 'special',
		},
		{
			id: 'ee96375bc4cf',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'YtTedtfI',
			percentageDiscount: '0.6',
			type: 'special',
		},
		{
			id: '3d8d5cdd451e',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'fcsiPxCs',
			percentageDiscount: '0.5',
			type: 'special',
		},
		{
			id: '3bf2f56a404e',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'Ae8p2peS',
			percentageDiscount: '0.4',
			type: 'special',
		},
		{
			id: '32ff65cd9a78',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 't6wtag0L',
			percentageDiscount: '0.25',
			type: 'special',
		},
		{
			id: '7910bf5f402a',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 't8eoLx7m',
			percentageDiscount: '0.20',
			type: 'special',
		},
		{
			id: 'b127c56263c1',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'Our27cg4',
			percentageDiscount: '0.1',
			type: 'special',
		},
		{
			id: '5d0a929cb56b',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'axKqK2Fa',
			percentageDiscount: '0.75',
			type: 'ppp',
		},
		{
			id: '8865942a34ec',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: '4Wu9Q6CP',
			percentageDiscount: '0.7',
			type: 'ppp',
		},
		{
			id: 'fde69219a02f',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'rtHlGd6U',
			percentageDiscount: '0.65',
			type: 'ppp',
		},
		{
			id: '2d0a63567a4f',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: '5Lozpfh7',
			percentageDiscount: '0.6',
			type: 'ppp',
		},
		{
			id: 'fc272c15ad5e',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'dJ2F6CAs',
			percentageDiscount: '0.55',
			type: 'ppp',
		},
		{
			id: 'ad3666fa3138',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: '6RiqK8sH',
			percentageDiscount: '0.5',
			type: 'ppp',
		},
		{
			id: 'e592ddad5a75',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'ZihdUCUK',
			percentageDiscount: '0.45',
			type: 'ppp',
		},
		{
			id: 'b127f3ce6b83',
			merchantAccountId: 'no-stripe',
			status: 1,
			identifier: 'oHR9dq3p',
			percentageDiscount: '0.4',
			type: 'ppp',
		},
	],
}
