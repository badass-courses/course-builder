import { NextRequest, NextResponse } from 'next/server'
import {
	getProductsWithFullStructure,
	getProductWithFullStructure,
} from '@/lib/products-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/products
 * Returns all products OR single product if ?slugOrId=xxx provided
 * Product includes full nested structure: product → cohort → workshops → sections → lessons
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		await log.info('api.products.get.started', {
			userId: user?.id,
			slugOrId,
			hasAbility: !!ability,
		})

		if (ability.cannot('read', 'Content')) {
			await log.warn('api.products.get.unauthorized', {
				userId: user?.id,
				slugOrId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (slugOrId) {
			const product = await getProductWithFullStructure(slugOrId)

			if (!product) {
				await log.warn('api.products.get.notfound', {
					userId: user?.id,
					slugOrId,
				})
				return NextResponse.json(
					{ error: 'Product not found' },
					{ status: 404, headers: corsHeaders },
				)
			}

			await log.info('api.products.get.success', {
				userId: user?.id,
				slugOrId,
				productId: product.id,
			})

			return NextResponse.json(product, { headers: corsHeaders })
		}

		const products = await getProductsWithFullStructure()

		await log.info('api.products.get.success', {
			userId: user?.id,
			resultCount: products.length,
		})

		return NextResponse.json(products, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.products.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			slugOrId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
