'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { Product } from '@coursebuilder/core/schemas'
import { cn } from '@coursebuilder/ui/utils/cn'

import { CldImage } from '../../src/components/cld-image'

type PurchaseSummaryContextType = {
	email: string
	product: Product
	title: string
	description?: React.JSX.Element | null
}

type RootProps = PurchaseSummaryContextType & {
	className?: string
}

const PurchaseSummaryContext = React.createContext<
	PurchaseSummaryContextType | undefined
>(undefined)

export const OrderSummaryProvider: React.FC<
	PurchaseSummaryContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<PurchaseSummaryContext.Provider value={props}>
			{children}
		</PurchaseSummaryContext.Provider>
	)
}

export const usePurchaseSummary = () => {
	const context = React.use(PurchaseSummaryContext)
	if (context === undefined) {
		throw new Error(
			'usePurchaseSummary must be used within an PurchaseSummaryProvider',
		)
	}
	return context
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	className,
	...props
}) => (
	<OrderSummaryProvider {...props}>
		<section className={cn('mx-auto w-full border-b pb-5', className)}>
			{children}
		</section>
	</OrderSummaryProvider>
)

// title

type TitleProps = {
	asChild?: boolean
	className?: string
}

const Title: React.FC<React.PropsWithChildren<TitleProps>> = ({
	className,
	asChild,
	children,
}) => {
	const { title } = usePurchaseSummary()
	const Comp = asChild ? Slot : 'h1'

	return (
		<Comp
			className={cn(
				'w-full text-balance text-lg font-medium sm:text-xl lg:text-2xl',
				className,
			)}
		>
			{children || title}
		</Comp>
	)
}

// status

type StatusProps = {
	className?: string
}

const Status: React.FC<React.PropsWithChildren<StatusProps>> = ({
	className,
	children = 'Success!',
}) => {
	return (
		<span
			className={cn(
				'text-primary block pb-4 text-sm font-semibold uppercase',
				className,
			)}
		>
			{children}
		</span>
	)
}

// description

type DescriptionProps = {
	className?: string
}

const Description: React.FC<React.PropsWithChildren<DescriptionProps>> = ({
	className,
	children,
}) => {
	const { description } = usePurchaseSummary()
	return children || description ? (
		<p className={cn('w-full text-balance pt-5', className)}>
			{children || description}
		</p>
	) : null
}

// product image

type ProductImageProps = {
	className?: string
}

const ProductImage: React.FC<React.PropsWithChildren<ProductImageProps>> = ({
	className,
	children,
}) => {
	const { product } = usePurchaseSummary()

	return children ? (
		children
	) : product?.fields?.image?.url ? (
		<CldImage
			className={cn('shrink-0', className)}
			src={product.fields.image.url}
			alt={product.fields?.image?.alt || product?.name}
			width={250}
			height={250}
		/>
	) : null
}

export { Root, Title, Description, ProductImage, Status }
