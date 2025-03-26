import LayoutClient from '@/components/layout-client'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import { getListForPost } from '@/lib/lists-query'
import { getCachedPostOrList, getPost } from '@/lib/posts-query'
import { getModuleProgressForUser } from '@/lib/progress'

import { cn } from '@coursebuilder/ui/utils/cn'

import { ListProvider } from './_components/list-provider'
import ListResourceNavigation, {
	MobileListResourceNavigation,
} from './_components/list-resource-navigation'
import { ProgressProvider } from './_components/progress-provider'

export default async function Layout(props: {
	children: React.ReactNode
	params: Promise<{ post: string }>
}) {
	const params = await props.params
	const post = await getCachedPostOrList(params.post)
	let list = null
	if (post?.type === 'list') {
		// nothing to do
	} else {
		list = await getListForPost(params.post)
	}
	const initialProgress = await getModuleProgressForUser(
		list ? list.id : params.post,
	)

	return (
		<ListProvider initialList={list}>
			<ProgressProvider initialProgress={initialProgress}>
				<ActiveHeadingProvider>
					<LayoutClient
						className={cn('', {})}
						// withContainer={list ? false : true}
					>
						<div className="flex flex-1">
							<ListResourceNavigation />
							<MobileListResourceNavigation />
							{props.children}
						</div>
					</LayoutClient>
				</ActiveHeadingProvider>
			</ProgressProvider>
		</ListProvider>
	)
}
