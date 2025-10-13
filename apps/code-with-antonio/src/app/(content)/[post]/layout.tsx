import LayoutClient from '@/components/layout-client'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import { getCachedListForPost } from '@/lib/lists-query'
import { getModuleProgressForUser } from '@/lib/progress'

import { getCachedPostOrList } from '../../../lib/posts-query'
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
	if (post && post.type === 'post') {
		list = await getCachedListForPost(params.post)
	}
	const initialProgress = await getModuleProgressForUser(
		list ? list.id : params.post,
	)

	return (
		<ListProvider initialList={list}>
			<ProgressProvider initialProgress={initialProgress}>
				<ActiveHeadingProvider>
					<LayoutClient withContainer>
						<div className="flex flex-1">
							<ListResourceNavigation />
							<MobileListResourceNavigation />
							<div className="w-full min-w-0">{props.children}</div>
						</div>
					</LayoutClient>
				</ActiveHeadingProvider>
			</ProgressProvider>
		</ListProvider>
	)
}
