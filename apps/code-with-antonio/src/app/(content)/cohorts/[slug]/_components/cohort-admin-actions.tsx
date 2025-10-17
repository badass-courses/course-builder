'use client'

import { use } from 'react'
import Link from 'next/link'
import type { Cohort } from '@/lib/cohort'

import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

export const CohortAdminActions = ({ cohort }: { cohort: Cohort }) => {
	const product = first(cohort.resourceProducts)?.product

	return (
		<div className="absolute right-0 top-1 z-10 flex items-center gap-2">
			{product && (
				<Button
					asChild
					size="sm"
					variant="secondary"
					className="bg-secondary/50 border-foreground/20 backdrop-blur-xs border"
				>
					<Link href={`/products/${product?.fields?.slug || product?.id}/edit`}>
						Edit Product
					</Link>
				</Button>
			)}
			<Button
				asChild
				size="sm"
				variant="secondary"
				className="bg-secondary/50 border-foreground/20 backdrop-blur-xs border"
			>
				<Link href={`/cohorts/${cohort.fields?.slug || cohort.id}/edit`}>
					Edit Cohort
				</Link>
			</Button>
		</div>
	)
}
