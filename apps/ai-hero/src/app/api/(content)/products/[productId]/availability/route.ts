import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { withSkill } from '@/server/with-skill'
import { eq } from 'drizzle-orm'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Cache-Control': 'no-store, max-age=0',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/products/[productId]/availability
 * Returns current seat availability for a product (for live events)
 * Used by client-side polling to detect when seats sell out
 */
const getAvailability = async (
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> },
) => {
	const { productId } = await params

	if (!productId) {
		return NextResponse.json(
			{ error: 'Product ID required' },
			{ status: 400, headers: corsHeaders },
		)
	}

	try {
		const product = await courseBuilderAdapter.getProduct(productId)

		if (!product) {
			return NextResponse.json(
				{ error: 'Product not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// If unlimited quantity, return -1
		if (product.quantityAvailable === -1) {
			return NextResponse.json(
				{ quantityAvailable: -1, unlimited: true },
				{ headers: corsHeaders },
			)
		}

		// Calculate current availability
		const totalPurchases = await db.query.purchases.findMany({
			where: eq(purchases.productId, productId),
		})

		const quantityAvailable =
			(product.quantityAvailable || 0) - totalPurchases.length

		return NextResponse.json(
			{
				quantityAvailable: Math.max(0, quantityAvailable),
				unlimited: false,
			},
			{ headers: corsHeaders },
		)
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch availability' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export const GET = withSkill(getAvailability)
