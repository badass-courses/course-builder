import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import {
	BadgeCheck,
	Check,
	FileCheck2,
	Infinity,
	ListVideo,
	Percent,
} from 'lucide-react'

import { Product } from '@coursebuilder/core/schemas'

export const ProductPricingFeatures = ({ product }: { product: Product }) => {
	const workshopNavigation = useWorkshopNavigation()
	const cohort = workshopNavigation?.cohorts?.[0]

	return (
		<div className="relative mt-5 flex w-full flex-col items-center">
			<strong className="mb-3 flex items-center text-center text-sm font-medium uppercase">
				<span className="bg-background py-1\ relative z-10 px-3">Includes</span>
				<div
					aria-hidden="true"
					className="bg-border absolute left-0 z-0 h-px w-full"
				/>
			</strong>
			{cohort && (
				<strong className="mb-2 inline-flex w-full text-left font-medium">
					{cohort.resources?.length} Workshops
				</strong>
			)}
			<ul className="mb-5 flex w-full flex-col gap-2">
				{cohort?.resources?.map((resource) => {
					return (
						<li className="flex items-baseline gap-2" key={resource.id}>
							<Check className="text-foreground/50 relative h-4 w-4 flex-shrink-0 translate-y-1" />
							{resource.title}
						</li>
					)
				})}
			</ul>
			<strong className="mb-2 inline-flex w-full text-left font-medium">
				Features
			</strong>
			<ul className="flex w-full flex-col gap-2">
				{/* <li className="flex items-center gap-2">
					<ListVideo className="h-4 w-4" />
					Over 90 Lessons
				</li> */}
				{/* <li className="flex items-center gap-2">
					<Infinity className="h-4 w-4" />
					Lifetime Access
				</li> */}
				<li className="flex items-center gap-2">
					<FileCheck2 className="h-4 w-4" />
					Customizable Invoice
				</li>
				<li className="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						aria-label="Closed Captioning"
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 18 18"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M9 16.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
						/>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M7.833 6.738A2.328 2.328 0 0 0 6.762 6.5C4.976 6.5 4.5 7.81 4.5 9s.476 2.5 2.262 2.5c.37.007.738-.075 1.071-.238m5-4.524a2.328 2.328 0 0 0-1.071-.238C9.976 6.5 9.5 7.81 9.5 9s.476 2.5 2.262 2.5c.37.007.738-.075 1.071-.238"
						/>
					</svg>
					English Transcripts & Subtitles
				</li>
				<li className="flex items-center gap-2">
					<Percent className="h-4 w-4" />
					Progress Tracking
				</li>
				<li className="flex items-center gap-2">
					<BadgeCheck className="h-4 w-4" />
					Completion Certificate
				</li>
			</ul>
		</div>
	)
}
