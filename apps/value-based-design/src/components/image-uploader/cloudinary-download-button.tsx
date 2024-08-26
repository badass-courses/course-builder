'use client'

import { use } from 'react'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { AbilityForResource } from '@/utils/get-current-ability-rules'
import { TRPCError } from '@trpc/server'
import { Download, Lock } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export const CloudinaryDownloadButton: React.FC<{
	resourceId: string
	lessonTitle: string
	abilityLoader?: Promise<AbilityForResource>
}> = ({ resourceId, lessonTitle, abilityLoader }) => {
	const ability = abilityLoader ? use(abilityLoader) : null
	const canView = ability?.canView

	const { mutateAsync: download, status } =
		api.imageResources.download.useMutation({
			onSuccess: (response) => {
				if (response instanceof TRPCError) {
					throw new Error('Sorry, I could not find that file.')
				}

				const byteCharacters = atob(response.data)
				const byteNumbers = new Array(byteCharacters.length)
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i)
				}
				const byteArray = new Uint8Array(byteNumbers)
				const blob = new Blob([byteArray], { type: 'application/zip' })

				// Create download link and trigger download
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = response.fileName
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				URL.revokeObjectURL(url)
			},
		})

	const downloadButton = canView ? (
		<>
			<Download className="h-5 w-5" /> Download
		</>
	) : (
		<>
			<Lock className="h-5 w-5" /> Download
		</>
	)

	return (
		<Button
			onClick={() => {
				download({ resourceId, lessonTitle })
			}}
			variant="outline"
			className={cn(
				'relative h-full w-full cursor-pointer',
				!canView && 'cursor-not-allowed opacity-50',
			)}
			disabled={!canView || status === 'pending'}
		>
			<div
				className={cn(
					'inset-0 flex items-center justify-center gap-2 transition-all duration-300 ease-in-out',
					status === 'pending' ? 'opacity-0' : 'opacity-100',
				)}
			>
				{downloadButton}
			</div>
			<div
				className={cn(
					'absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ease-in-out',
					status === 'pending' ? 'opacity-100' : 'opacity-0',
				)}
			>
				<Spinner className="h-5 w-5" />
			</div>
		</Button>
	)
}

const Spinner: React.FunctionComponent<{
	className?: string
}> = ({ className = 'w-8 h-8', ...rest }) => (
	<svg
		className={cn('animate-spin', className)}
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		{...rest}
	>
		<title>Loading</title>
		<circle
			opacity={0.25}
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			strokeWidth="4"
		/>
		<path
			opacity={0.75}
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		/>
	</svg>
)
