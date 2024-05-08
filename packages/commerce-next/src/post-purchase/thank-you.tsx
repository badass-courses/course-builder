import * as React from 'react'
import Image from 'next/image'
import Balancer from 'react-wrap-balancer'

import { Product } from '@coursebuilder/core/schemas'

type ThankYouProps = {
	email: string
	product: Product
	title: string
	byline: JSX.Element | null
}

export const ThankYou: React.FC<ThankYouProps> = ({
	title,
	byline,
	product,
	email,
}) => {
	return (
		<header className="mx-auto w-full">
			<div className="flex flex-col items-center gap-10 sm:flex-row">
				{product?.fields.image && (
					<div className="flex flex-shrink-0 items-center justify-center">
						<Image
							src={product.fields.image.url}
							alt={product.fields.image.alt || product.name}
							width={250}
							height={250}
						/>
					</div>
				)}
				<div className="flex w-full flex-col items-start">
					<h1 className="w-full text-lg font-semibold sm:text-xl lg:text-2xl">
						<span className="text-primary block pb-4 text-sm font-semibold uppercase">
							Success!
						</span>
						<span className="w-full text-balance">{title}</span>
					</h1>
					<p className="pt-5 text-lg font-normal">
						<Balancer>{byline}</Balancer>
					</p>
				</div>
			</div>
		</header>
	)
}
