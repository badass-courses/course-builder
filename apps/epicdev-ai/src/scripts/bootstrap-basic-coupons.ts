import { db } from '@/db'
import { merchantCoupon } from '@/db/schema'
import { env } from '@/env.mjs'
import { sql } from 'drizzle-orm'
import uuid from 'shortid'
import Stripe from 'stripe'

const config = {
	stripeAccountId: 'acct_1He3UBAclagrtXef',
	merchantAccountId: 'ma_clv1pegll000008jvbm0udeat',
	uuidPrefix: 'cb_',
	products: [],
	coupons: [
		{
			type: 'ppp',
			percentageDiscount: 0.4,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.45,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.5,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.55,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.6,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.65,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.7,
		},
		{
			type: 'ppp',
			percentageDiscount: 0.75,
		},
		{
			type: 'special',
			percentageDiscount: 0.1,
		},
		{
			type: 'special',
			percentageDiscount: 0.25,
		},
		{
			type: 'special',
			percentageDiscount: 0.4,
		},
		{
			type: 'special',
			percentageDiscount: 0.5,
		},
		{
			type: 'special',
			percentageDiscount: 0.6,
		},
		{
			type: 'special',
			percentageDiscount: 0.75,
		},
		{
			type: 'special',
			percentageDiscount: 0.9,
		},
		{
			type: 'special',
			percentageDiscount: 0.95,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.05,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.1,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.15,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.25,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.35,
		},
		{
			type: 'bulk',
			percentageDiscount: 0.45,
		},
	],
}

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN!, {
	apiVersion: '2024-06-20',
})

async function createCoupons() {
	for (const coupon of config.coupons) {
		const { id } = await stripe.coupons.create({
			duration: 'forever',
			name: `${coupon.type} ${Math.floor(coupon.percentageDiscount * 100)}%`,
			percent_off: Math.floor(coupon.percentageDiscount * 100),
			metadata: {
				type: coupon.type,
			},
		})

		await db.insert(merchantCoupon).values({
			id: `${config.uuidPrefix}${uuid()}`,
			merchantAccountId: config.merchantAccountId,
			status: 1,
			identifier: id,
			percentageDiscount: coupon.percentageDiscount.toString(),
			type: coupon.type,
		})
	}
}

await createCoupons()
