import React from 'react'
import { notFound } from 'next/navigation'
import CouponDataTable from '@/app/admin/coupons/_components/coupon-data-table'
import CouponGeneratorForm from '@/app/admin/coupons/_components/coupon-generator-form'
import { db } from '@/db'
import { coupon } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { desc } from 'drizzle-orm'
import z from 'zod'

import { couponSchema, productSchema } from '@coursebuilder/core/schemas'

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

	const productsLoader = db.query.products.findMany().then((products) => {
		return z.array(productSchema).parse(products)
	})

	return (
		<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
			<div className="flex items-center">
				<h1 className="text-lg font-semibold md:text-2xl">Coupons</h1>
			</div>
			<section className=" w-full max-w-screen-lg space-y-5 px-5 py-8">
				<h2 className="text-lg font-semibold md:text-2xl">Create new</h2>
				<CouponGeneratorForm productsLoader={productsLoader} />
			</section>
			<section className="w-full max-w-screen-lg border-t px-5 pt-10">
				<h2 className="text-lg font-semibold md:text-2xl">History</h2>
				<CouponDataTable coupons={coupons} />
			</section>
		</main>
	)
}
