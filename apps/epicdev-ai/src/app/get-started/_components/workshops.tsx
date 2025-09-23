'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/brand/icons'
import { Workshop } from '@/lib/workshops'
import { GlobeIcon } from 'lucide-react'

const Workshops: React.FC<{ workshops: Workshop[] }> = ({ workshops }) => {
	const publishedWorkshops = workshops.filter(
		(workshop) => workshop.fields.state === 'published',
	)

	return (
		<div className="not-prose my-8 flex flex-col items-center justify-center text-lg sm:gap-4 md:text-lg">
			<strong className="flex w-full">Workshops</strong>
			<ul className="w-full divide-y pb-5">
				{publishedWorkshops.map((workshop) => {
					return <ModuleWorkshopAppItem key={workshop.id} module={workshop} />
				})}
			</ul>
			{/* {tutorials.length > 0 && (
        <>
          <strong className="flex w-full">Tutorials</strong>
          <ul className="w-full divide-y">
            {tutorials.map((tutorial) => {
              return (
                <ModuleWorkshopAppItem key={tutorial.id} module={tutorial} />
              )
            })}
          </ul>
        </>
      )} */}
		</div>
	)
}
export default Workshops

const ModuleWorkshopAppItem = ({ module }: { module: Workshop }) => {
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
			<div className="flex flex-shrink-0 items-center justify-end gap-5 pr-5 text-sm font-medium">
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
