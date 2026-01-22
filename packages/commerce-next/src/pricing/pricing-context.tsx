import * as React from 'react'
import { use } from 'react'
import { useMachine } from '@xstate/react'

import {
	PricingContextType,
	pricingMachine,
	PricingMachineInput,
} from '@coursebuilder/core/pricing/pricing-state-machine'
import { MerchantCoupon } from '@coursebuilder/core/schemas'
import { PricingData } from '@coursebuilder/core/types'

const PricingContext = React.createContext<
	| (PricingContextType & {
			status: 'success' | 'pending' | 'error'
			toggleBuyingMoreSeats: () => void
			toggleTeamPurchase: () => void
			updateQuantity: (quantity: number) => void
			setMerchantCoupon: (merchantCoupon: MerchantCoupon | undefined) => void
			userId: string | undefined
			pricingData: PricingData
			organizationId: string | undefined
			isSoldOut: boolean
	  })
	| undefined
>(undefined)

export const PricingProvider = ({
	children,
	...props
}: PricingMachineInput & {
	children: React.ReactNode
}) => {
	const pricingData = use(props.pricingDataLoader)
	const [state, send] = useMachine(pricingMachine, {
		input: { ...props, pricingData },
	})

	const toggleBuyingMoreSeats = () => {
		send({
			type: 'TOGGLE_BUYING_MORE_SEATS',
		})
		send({
			type: 'UPDATE_QUANTITY',
			quantity: 5,
		})
	}
	const toggleTeamPurchase = () => {
		send({
			type: 'TOGGLE_TEAM_PURCHASE',
		})
	}
	const updateQuantity = (quantity: number) => {
		send({
			type: 'UPDATE_QUANTITY',
			quantity,
		})
	}
	const setMerchantCoupon = (merchantCoupon: MerchantCoupon | undefined) => {
		send({
			type: 'SET_MERCHANT_COUPON',
			merchantCoupon,
		})
	}

	const hasUsedCouponWithBypassSoldOut = Boolean(
		state.context.formattedPrice?.usedCoupon?.fields?.bypassSoldOut,
	)

	const isSoldOut = Boolean(
		!hasUsedCouponWithBypassSoldOut &&
			(state.context.product.type === 'live' ||
				state.context.product.type === 'cohort') &&
			pricingData.quantityAvailable !== -1 &&
			(pricingData.quantityAvailable || 0) <= 0,
	)

	return (
		<PricingContext.Provider
			value={{
				...state.context,
				status: state.value === 'Ready To Buy' ? 'success' : 'pending',
				toggleBuyingMoreSeats,
				toggleTeamPurchase,
				updateQuantity,
				setMerchantCoupon,
				pricingData,
				organizationId: props.organizationId,
				isSoldOut,
			}}
		>
			{children}
		</PricingContext.Provider>
	)
}

export const usePricing = () => {
	const context = React.use(PricingContext)
	if (!context) {
		throw new Error('usePricing must be used within a PricingProvider')
	}
	return context
}
