import { ContentNavigationProvider } from '@/app/(content)/_components/navigation/provider'
import LayoutClient from '@/components/layout-client'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import { getContentNavigation } from '@/lib/content-navigation-query'
import { getCachedListForPost } from '@/lib/lists-query'
import { getModuleProgressForUser } from '@/lib/progress'

import { ModuleProgressProvider } from '../_components/module-progress-provider'
import ModuleResourceList from '../_components/navigation/module-resource-list'
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
	const moduleProgressLoader = getModuleProgressForUser(
		list ? list.id : params.post,
	)

	return (
		<ContentNavigationProvider
			navigationDataLoader={getContentNavigation(
				list ? list.id : post?.id || '',
			)}
		>
			<ListProvider initialList={list}>
				<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
					<ProgressProvider initialProgress={initialProgress}>
						<ActiveHeadingProvider>
							<LayoutClient>
								<div className="flex flex-1 items-start">
									{list && (
										<ModuleResourceList className="sticky top-0 hidden max-w-xs border-x border-b lg:block" />
									)}
									{/* <MobileListResourceNavigation /> */}
									<div className="w-full min-w-0">{props.children}</div>
								</div>
							</LayoutClient>
						</ActiveHeadingProvider>
					</ProgressProvider>
				</ModuleProgressProvider>
			</ListProvider>
		</ContentNavigationProvider>
	)
}
