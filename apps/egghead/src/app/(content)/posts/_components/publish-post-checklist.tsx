import { useState } from 'react'
import Link from 'next/link'
import { cx } from 'class-variance-authority'
import { CheckIcon } from 'lucide-react'

export default function PublishPostChecklist() {
	const checklistItems = [
		{
			id: 'title',
			label: 'Title describes key takeaway',
			link: 'https://howtoegghead.com/instructor/style-guide/thinking-in-lessons/',
		},
		{
			id: 'description',
			label: 'Description summarizes the topics covered',
			link: 'https://howtoegghead.com/instructor/style-guide/thinking-in-lessons/',
		},
		{
			id: 'audio-quality',
			label: 'Audio quality is clear and free of background noise',
			link: 'https://egghead.io/courses/salvaging-recordings-with-screenflow-1402a37c',
		},
		{
			id: 'screen-setup',
			label: 'Fontsize is large and desktop free of distractions',
			link: 'https://howtoegghead.com/instructor/screencasting/screen-setup/',
		},
		{
			id: 'seo-description',
			label: 'SEO description includes keywords and API used',
		},
	]

	return (
		<div className="space-y-4 p-5">
			<h3 className="text-lg font-bold">Publish Checklist</h3>
			<div className="space-y-2">
				{checklistItems.map((item) => (
					<div key={item.id} className="flex items-center space-x-2">
						<ChecklistItem id={item.id} label={item.label} link={item.link} />
					</div>
				))}
			</div>
		</div>
	)
}

const ChecklistItem = ({
	id,
	label,
	link,
}: {
	id: string
	label: string
	link?: string
}) => {
	const [isChecked, setIsChecked] = useState(false)

	return (
		<div className="flex items-center gap-2">
			<div className="prose prose-sm dark:prose-invert flex items-center gap-4 text-sm leading-none">
				<div className="relative">
					<input
						type="checkbox"
						id={id}
						className="ring-primary h-3 w-3 shrink-0 cursor-pointer appearance-none rounded-xl ring-1 transition-all duration-300 checked:bg-black checked:ring-black"
						onChange={(e) => setIsChecked(e.target.checked)}
					/>
					<CheckIcon
						className={cx(
							'pointer-events-none absolute left-0 top-0 h-3 w-3 text-white transition-all duration-300',
							{
								'opacity-100': isChecked,
								'opacity-0': !isChecked,
							},
						)}
					/>
				</div>
				{link ? (
					<Link
						href={link}
						target="_blank"
						rel="noopener noreferrer"
						className="w-fit cursor-pointer text-blue-600 hover:underline"
					>
						{label}
					</Link>
				) : (
					<div>{label}</div>
				)}
			</div>
		</div>
	)
}
