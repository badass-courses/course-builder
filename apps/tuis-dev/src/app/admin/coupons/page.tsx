import React from 'react'
import { notFound } from 'next/navigation'
import CouponDataTable from '@/app/admin/coupons/_components/coupon-data-table'
import CouponGeneratorForm from '@/app/admin/coupons/_components/coupon-generator-form'
import { db } from '@/db'
import { coupon, products } from '@/db/schema'
import { getPastEventIds } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import { desc } from 'drizzle-orm'
import z from 'zod'

import { couponSchema, productSchema } from '@coursebuilder/core/schemas'

const getActiveProducts = async () => {
	const productsData = await db.query.products.findMany({
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
		orderBy: desc(products.createdAt),
	})
	const pastEventIds = await getPastEventIds()

	return { products: productsData, pastEventIds }
}

export default async function AdminCouponPage() {
	const { ability } = await getServerAuthSession()

	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const coupons = z.array(couponSchema).parse(
		await db.query.coupon.findMany({
			orderBy: desc(coupon.createdAt),
			limit: 100,
		}),
	)

	const productsLoader = getActiveProducts().then(
		({ products, pastEventIds }) => {
			return {
				products: z.array(productSchema).parse(products),
				pastEventIds,
			}
		},
	)

	return (
		<main className="flex w-full flex-1 flex-col gap-5">
			<h1 className="font-heading text-xl font-bold sm:text-3xl">Coupons</h1>
			<section className="">
				<h2 className="fluid-xl font-heading mb-8 font-semibold">Create new</h2>
				<CouponGeneratorForm productsLoader={productsLoader} />
			</section>
			<section className="mt-5 border-t pt-10">
				<h2 className="fluid-xl font-heading mb-5 font-semibold">Browse</h2>
				<CouponDataTable coupons={coupons} />
			</section>
		</main>
	)
}
