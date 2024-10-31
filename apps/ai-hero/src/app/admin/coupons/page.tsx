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
		<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 pt-10 lg:gap-10">
			<h1 className="fluid-3xl font-heading font-bold">Coupons</h1>
			<section className=" ">
				<h2 className="fluid-xl font-heading mb-8 font-bold">Create new</h2>
				<CouponGeneratorForm productsLoader={productsLoader} />
			</section>
			<section>
				<h2 className="fluid-xl font-heading mb-5 font-bold">History</h2>
				<CouponDataTable coupons={coupons} />
			</section>
		</main>
	)
}
