import { notFound } from 'next/navigation'
import CouponDataTable from '@/app/admin/coupons/_components/coupon-data-table'
import CouponGeneratorForm from '@/app/admin/coupons/_components/coupon-generator-form'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { asc, desc } from 'drizzle-orm'
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
		}),
	)

	const productsLoader = db.query.products.findMany().then((products) => {
		return z.array(productSchema).parse(products)
	})

	return (
		<div className={`flex flex-col gap-4 p-4`}>
			<main className="flex flex-grow flex-col items-center space-y-5 pb-16">
				<h2 className="w-full max-w-screen-lg px-5 text-left text-3xl font-bold">
					Coupons
				</h2>
				<section className="mx-auto w-full max-w-screen-lg space-y-5 px-5 py-8">
					<h3 className="text-2xl font-medium">Create new</h3>
					<CouponGeneratorForm productsLoader={productsLoader} />
				</section>
				<section className="mx-auto w-full max-w-screen-lg border-t px-5 pt-10">
					<h3 className="text-2xl font-medium">History</h3>
					<CouponDataTable coupons={coupons} />
				</section>
			</main>
		</div>
	)
}
