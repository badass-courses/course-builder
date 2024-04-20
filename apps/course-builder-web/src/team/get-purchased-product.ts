import { getSdk } from '@skillrecordings/database'
import groq from 'groq'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import last from 'lodash/last'
import { getToken } from 'next-auth/jwt'

import { sanityClient } from '../utils/sanity-client'

const defaultProductQuery = groq`*[_type == "product" && productId == $productId][0]{
  productId,
  modules[]->{
    "slug": slug.current,
    title,
    image {
      url, alt
    },
    sections[]->{
      "slug": slug.current,
      title,
      lessons[]->{
        "slug": slug.current,
        title
      }
    }
  }
  }`

/**
 * gets the top tier product for user and all purchases
 * TODO: move to skill-api
 * @param req
 * @param productQuery
 */
export async function getPurchasedProduct(
	req: any,
	productQuery: string = defaultProductQuery,
) {
	const token = await getToken({ req })
	const { getPurchasesForUser } = getSdk()
	if (token && token.sub) {
		// no need to reload purchases since they are on the session
		const purchases = (await getPurchasesForUser(token.id as string)) || []

		if (!isEmpty(purchases)) {
			const productId = get(last(purchases), 'productId')

			// fetch product from sanity based on user's productId associated with their purchase
			return {
				product: await sanityClient.fetch(productQuery, {
					productId: productId,
				}),
				purchases,
				token,
			}
		}
	}
	return { product: { modules: [] }, token }
}
