'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/brand/icons'
import { GlobeIcon } from 'lucide-react'

/**
 * Groups workshops by product or cohort
 */
const groupWorkshops = (workshops: any[]) => {
	const groups: Record<string, { title: string; workshops: any[] }> = {}

	workshops.forEach((workshop: any) => {
		const product = workshop.resourceProducts?.[0]?.product
		const cohort = workshop.resourceOf?.find(
			(r: any) => r.resourceOf?.type === 'cohort',
		)?.resourceOf

		const groupKey = product?.id || cohort?.id || 'other'
		const groupTitle =
			product?.name || cohort?.fields?.title || 'Other Workshops'

		if (!groups[groupKey]) {
			groups[groupKey] = { title: groupTitle, workshops: [] }
		}

		groups[groupKey]?.workshops.push(workshop)
	})

	return Object.entries(groups).map(([key, value]) => ({
		key,
		...value,
	}))
}

const Workshops: React.FC<{ workshops: any[] }> = ({ workshops }) => {
	const published = workshops.filter((w) => w.fields.state === 'published')
	const grouped = groupWorkshops(published)

	return (
		<div className="not-prose my-8 flex flex-col items-center justify-center text-lg sm:gap-4 md:text-lg">
			{grouped.map((group) => (
				<div key={group.key} className="w-full">
					<h3 className="mb-2 mt-4 text-xl font-bold">{group.title}</h3>
					<ul className="w-full divide-y pb-5">
						{group.workshops.map((workshop) => (
							<ModuleWorkshopAppItem key={workshop.id} module={workshop} />
						))}
					</ul>
				</div>
			))}
		</div>
	)
}
export default Workshops

const ModuleWorkshopAppItem = ({ module }: { module: any }) => {
	if (!module?.fields.github) return null

	const deployedUrl = module?.fields.workshopApp?.externalUrl

	return (
		<li
			key={module.id}
			className="flex min-h-[56px] w-full flex-col justify-between gap-2 py-4 font-semibold sm:flex-row sm:items-center sm:gap-5 sm:py-2"
		>
			<div className="flex items-center gap-3">
				{module.fields.coverImage?.url ? (
					<Image
						src={module.fields.coverImage?.url}
						width={50}
						height={50}
						alt={module.fields.title}
						aria-hidden
					/>
				) : null}
				<Link
					href={module.fields.github}
					target="_blank"
					rel="noopener noreferrer"
					className="group leading-tight hover:underline"
				>
					{module.fields.title}{' '}
					<span className="opacity-50 transition group-hover:opacity-100">
						↗︎
					</span>
				</Link>
			</div>
			<div className="flex flex-shrink-0 items-center gap-5 pr-5 pt-1 text-sm font-medium sm:justify-end sm:pt-0">
				{deployedUrl && (
					<Link
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 hover:underline"
						href={deployedUrl}
					>
						<GlobeIcon className="h-4 w-4 opacity-75" />
						Deployed Version
					</Link>
				)}
				<Link
					href={module.fields.github + '?tab=readme-ov-file#setup'}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 hover:underline"
				>
					<Icon name="Github" size="16" className="opacity-75" />
					Setup
				</Link>
			</div>
		</li>
	)
}
