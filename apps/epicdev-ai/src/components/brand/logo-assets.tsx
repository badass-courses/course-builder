'use client'

import * as React from 'react'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/utils/cn'
import { renderToString } from 'react-dom/server'

import { Button } from '@coursebuilder/ui'
import { toast } from '@coursebuilder/ui/primitives/use-toast'

export const LogoAsset: React.FC<
	React.PropsWithChildren<{ asset: React.ReactElement; className?: string }>
> = ({ children, asset, className }) => {
	return (
		<div
			className={cn(
				'flex w-full grid-cols-2 flex-col place-items-center items-center gap-10 py-10 md:grid md:gap-16 md:py-16',
				className,
			)}
		>
			{children}
			<div className="flex items-center gap-1">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						navigator.clipboard.writeText(renderToString(asset))
						toast({
							title: 'SVG Copied',
							description: 'The SVG has been copied to your clipboard',
						})
					}}
				>
					Copy SVG
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						const svg = new Blob([renderToString(asset)], {
							type: 'image/svg+xml',
						})
						const url = URL.createObjectURL(svg)
						const a = document.createElement('a')
						a.href = url
						a.download = 'logo.svg'
						a.click()
						URL.revokeObjectURL(url)
					}}
				>
					Save SVG
				</Button>
			</div>
		</div>
	)
}
