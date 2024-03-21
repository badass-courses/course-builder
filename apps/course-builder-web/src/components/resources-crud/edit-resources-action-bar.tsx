import * as React from 'react'
import Link from 'next/link'

import { Button } from '@coursebuilder/ui'

export function EditResourcesActionBar({
	onSubmit,
	resource,
	resourcePath,
}: {
	resource: {
		_type: string
		_id: string
		body?: string | null
		title?: string | null
		slug: string
	}
	onSubmit: () => void
	resourcePath: string
}) {
	return (
		<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
			<div className="flex items-center gap-2">
				<Button className="px-0" asChild variant="link">
					<Link href={resourcePath} className="aspect-square">
						←
					</Link>
				</Button>
				<span className="font-medium">
					{resource._type.toUpperCase()}{' '}
					<span className="hidden font-mono text-xs font-normal md:inline-block">
						({resource._id})
					</span>
				</span>
			</div>
			<Button
				onClick={(e) => {
					onSubmit()
				}}
				type="button"
				variant="default"
				size="sm"
				className="h-7 disabled:cursor-wait"
			>
				Save
			</Button>
		</div>
	)
}
