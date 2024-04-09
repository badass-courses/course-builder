// This work is needed as workaround to Drizzle truncating millisecond precision.
// https://github.com/drizzle-team/drizzle-orm/pull/668

import { randomUUID } from 'utils/adapter.js'

import { purchaseSchema } from '@coursebuilder/core/schemas'

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
const DEFAULT_PRODUCT_ID = 'default-product-id'
const UPGRADE_PRODUCT_ID = 'upgrade-product-id'
const VALID_INDIA_COUPON_ID = 'valid-india-coupon-id'
const SITE_SALE_COUPON_ID = 'valid-site-coupon-id'
const LARGE_SITE_SALE_COUPON_ID = 'valid-jumbo-coupon-id'
const ORIGINAL_PPP_PURCHASE_ID = 'original-ppp-purchase-id'
const UPGRADED_PPP_PURCHASE_ID = 'upgraded-ppp-purchase-id'

const mockProduct = {
	id: DEFAULT_PRODUCT_ID,
	name: 'professional',
	createdAt: new Date(),
	key: 'hey',
	status: 1,
	quantityAvailable: -1,
}

const mockUpgradeProduct = {
	id: UPGRADE_PRODUCT_ID,
	name: 'professional',
	createdAt: new Date(),
	key: 'hey',
	status: 1,
	quantityAvailable: -1,
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
		bulkCouponId: randomUUID(),
		merchantCouponId: randomUUID(),
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
}
