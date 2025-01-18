import React from 'react'
import Link from 'next/link'
import { type List } from '@/lib/lists'
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import { ArrowRight, ChevronRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export default function PostNextUpFromListPagination({
	listLoader,
	postId,
}: {
	listLoader: Promise<List | null>
	postId: string
}) {
	const list = React.use(listLoader)
	const nextUp = list && getNextUpResourceFromList(list, postId)
	return nextUp?.resource && nextUp?.resource?.fields?.state === 'published' ? (
		<nav
			className="mt-8 flex w-full flex-col items-center rounded bg-gray-950 px-5 py-10 text-center"
			aria-label="List navigation"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Continue</h2>
			<ul>
				<li>
					<Button
						className="text-primary inline-flex items-center gap-2 text-lg lg:text-xl"
						asChild
						variant="link"
					>
						<Link href={`/${nextUp.resource.fields?.slug}`}>
							{nextUp.resource.fields?.title} <ArrowRight className="w-4" />
						</Link>
					</Button>
				</li>
			</ul>
		</nav>
	) : null
}
