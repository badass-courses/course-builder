'use client'

import { use } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { AbilityForResource } from '@/utils/get-current-ability-rules'
import { Download, Lock } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export const AssetDownloadButton: React.FC<{
	abilityLoader?: Promise<AbilityForResource>
	downloadUrl: string
}> = ({ abilityLoader, downloadUrl }) => {
	const ability = abilityLoader ? use(abilityLoader) : null
	const canView = ability?.canView

	return (
		<Button
			variant="outline"
			className={cn(
				'h-full w-full cursor-pointer',
				!canView && 'cursor-not-allowed opacity-50',
			)}
			disabled={!canView}
		>
			<div className="">
				{canView ? (
					<Link
						href={downloadUrl}
						target="_blank"
						className="flex items-center justify-center gap-2"
					>
						<Download className="h-5 w-5" /> Download
					</Link>
				) : (
					<div className="flex cursor-not-allowed items-center justify-center gap-2">
						<Lock className="h-5 w-5" /> Download
					</div>
				)}
			</div>
		</Button>
	)
}
