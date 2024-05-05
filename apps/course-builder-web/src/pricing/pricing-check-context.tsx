import * as React from 'react'
import { Dispatch, SetStateAction } from 'react'

import { MerchantCoupon } from '@coursebuilder/core/schemas'
import { FormattedPrice } from '@coursebuilder/core/types'

type MinimalMerchantCoupon = Omit<
	MerchantCoupon & {
		country?: string
	},
	'identifier'
>

type PricingContextType = {
	addPrice: (price: FormattedPrice, productId: string) => void
	isDowngrade: (price?: FormattedPrice | null) => boolean
	isDiscount: (price?: FormattedPrice | null) => boolean
	merchantCoupon?: MinimalMerchantCoupon | undefined | null
	setMerchantCoupon: Dispatch<SetStateAction<MinimalMerchantCoupon | undefined>>
	quantity: number
	setQuantity: Dispatch<SetStateAction<number>>
}

const defaultPriceCheckContext: PricingContextType = {
	addPrice: () => {},
	isDowngrade: () => false,
	isDiscount: () => false,
	merchantCoupon: undefined,
	setMerchantCoupon: () => {},
	quantity: 1,
	setQuantity: () => {},
}

/**
 * used to check if a given price is a downgrade for the customer
 */
export function usePriceCheck() {
	return React.useContext(PriceCheckContext)
}

export const PriceCheckContext = React.createContext(defaultPriceCheckContext)

export const PriceCheckProvider: React.FC<React.PropsWithChildren<any>> = ({
	children,
	purchasedProductIds,
}) => {
	const [prices, setPrices] = React.useState<any>({})

	const addPrice = React.useCallback(
		(price: FormattedPrice, productId: string) => {
			setPrices((prevPrices: any) => ({
				...prevPrices,
				[productId]: price,
			}))
		},
		[prices],
	)

	const isDowngrade = React.useCallback(
		(price?: FormattedPrice | null) => {
			if (!price || !purchasedProductIds || purchasedProductIds.length === 0) {
				return false
			}

			for (const productId of purchasedProductIds) {
				for (const key in prices) {
					if (key === productId) {
						if (prices[key].unitPrice > price.unitPrice) {
							return true
						}
					}
				}
			}
			return false
		},
		[prices],
	)

	const isDiscount = React.useCallback((price?: FormattedPrice | null) => {
		if (!price) {
			return false
		}
		return price.fullPrice > price.calculatedPrice
	}, [])

	const [merchantCoupon, setMerchantCoupon] = React.useState<
		MinimalMerchantCoupon | undefined
	>()

	const [quantity, setQuantity] = React.useState(1)

	return (
		<PriceCheckContext.Provider
			value={{
				addPrice,
				isDowngrade,
				isDiscount,
				merchantCoupon,
				setMerchantCoupon,
				quantity,
				setQuantity,
			}}
		>
			{children}
		</PriceCheckContext.Provider>
	)
}
