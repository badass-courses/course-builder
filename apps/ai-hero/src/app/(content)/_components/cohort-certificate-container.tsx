'use client'

import * as CohortCertificate from '@/components/certificates/cohort-certificate'
import { Lock, LockKeyhole } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export const Certificate = ({
	resourceSlugOrId,
	isCompleted,
}: {
	resourceSlugOrId: string
	isCompleted: boolean
}) => {
	return isCompleted ? (
		<CohortCertificate.Root resourceIdOrSlug={resourceSlugOrId}>
			<CohortCertificate.Trigger className="text-foreground hover:bg-muted bg-background aspect-842/595 relative flex h-fit w-full flex-col gap-2 rounded border">
				<div className="text-primary text-sm uppercase tracking-wide">
					Now Available
				</div>
				<div className="text-lg font-semibold">Certificate of Completion</div>
				<Button variant="outline" className="mt-2" asChild>
					<div>Get Certificate</div>
				</Button>
				<Bg />
			</CohortCertificate.Trigger>
			<CohortCertificate.Dialog>
				<CohortCertificate.NameInput />
				<CohortCertificate.DownloadButton />
				<div>
					<p className="pb-1 text-sm font-medium">
						Share URL (can be used on LinkedIn, etc.)
					</p>
					<div className="flex items-center">
						<CohortCertificate.GenerateShareUrlButton />
						<CohortCertificate.ShareUrl />
					</div>
				</div>
			</CohortCertificate.Dialog>
		</CohortCertificate.Root>
	) : (
		<div className="bg-background aspect-842/595 relative flex h-fit w-full flex-col items-center justify-center rounded border text-sm">
			<div className="bg-muted rounded-full p-3">
				<Lock className="h-4 w-4" />
			</div>
			<div className="mt-2 text-lg font-semibold">
				Certificate of Completion
			</div>
			<span className="opacity-75">Complete all workshops to unlock.</span>
			<Bg />
		</div>
	)
}

const Bg = () => {
	return (
		<svg
			className="absolute left-0 top-0 h-fit w-full"
			// width="842"
			// height="595"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 842 595"
		>
			<circle
				cx="22.102"
				cy="25.244"
				r="5.102"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<path
				fill="currentColor"
				d="M794.262 25.244h1v-1h-1v1Zm-746.524 0v-1h-1v1h1Zm772.16 25.636h1v-1h-1v1Zm0 493.24v1h1v-1h-1Zm-25.636 25.636v1h1v-1h-1Zm-746.524 0h-1v1h1v-1ZM22.102 544.12h-1v1h1v-1Zm0-493.24v-1h-1v1h1Zm772.16-26.636H47.738v2h746.524v-2Zm25.636 25.636c-13.606 0-24.636-11.03-24.636-24.636h-2c0 14.711 11.925 26.636 26.636 26.636v-2Zm1 494.24V50.88h-2v493.24h2Zm-25.636 25.636c0-13.606 11.03-24.636 24.636-24.636v-2c-14.711 0-26.636 11.925-26.636 26.636h2Zm-747.524 1h746.524v-2H47.738v2ZM22.102 545.12c13.606 0 24.636 11.03 24.636 24.636h2c0-14.711-11.925-26.636-26.636-26.636v2Zm-1-494.24v493.24h2V50.88h-2Zm25.636-25.636c0 13.606-11.03 24.636-24.636 24.636v2c14.71 0 26.636-11.925 26.636-26.636h-2Z"
			/>
			<path
				opacity={0.5}
				stroke="currentColor"
				d="M54.257 32.243h733.486c0 13.795 11.183 24.977 24.977 24.977v480.56c-13.794 0-24.977 11.182-24.977 24.977H54.257c0-13.795-11.183-24.977-24.977-24.977V57.22c13.794 0 24.977-11.182 24.977-24.977Z"
			/>
			<circle
				cx="22.102"
				cy="569.756"
				r="5.102"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<circle
				cx="819.898"
				cy="25.244"
				r="5.102"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<circle
				cx="819.898"
				cy="569.756"
				r="5.102"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</svg>
	)
}
