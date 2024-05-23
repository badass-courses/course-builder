import * as React from 'react'
import { use } from 'react'
import { useMachine } from '@xstate/react'

import { MerchantCoupon } from '@coursebuilder/core/schemas'

import {
	PricingContextType,
	pricingMachine,
	PricingMachineInput,
} from './pricing-state-machine'
import { PricingData } from './pricing-widget'

const PricingContext = React.createContext<
	| (PricingContextType & {
			status: 'success' | 'pending' | 'error'
			toggleBuyingMoreSeats: () => void
			toggleTeamPurchase: () => void
			updateQuantity: (quantity: number) => void
			setMerchantCoupon: (merchantCoupon: MerchantCoupon | undefined) => void
			userId: string | undefined
			pricingData: PricingData
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
		input: props,
	})

	console.log('state', state)

	const toggleBuyingMoreSeats = () => {
		send({
			type: 'TOGGLE_BUYING_MORE_SEATS',
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
