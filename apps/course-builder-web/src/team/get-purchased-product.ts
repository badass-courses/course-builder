import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import last from 'lodash/last'

export async function getPurchasedProduct() {
	const { session } = await getServerAuthSession()
	const { getPurchasesForUser, getProduct } = courseBuilderAdapter
	if (session?.user && session.user.id) {
		const purchases = (await getPurchasesForUser(session.user.id)) || []

		if (!isEmpty(purchases)) {
			const productId = get(last(purchases), 'productId')

			if (!productId) return null

			const product = await getProduct(productId)

			// fetch product from sanity based on user's productId associated with their purchase
			return {
				product,
				purchases,
				token: session.user,
			}
		}
	}
	return { product: { modules: [] }, token: session?.user }
}
