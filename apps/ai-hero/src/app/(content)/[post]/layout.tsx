import LayoutClient from '@/components/layout-client'
import { getListForPost } from '@/lib/lists-query'
import { getModuleProgressForUser } from '@/lib/progress'

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
	const list = await getListForPost(params.post)
	const initialProgress = await getModuleProgressForUser(
		list ? list.id : params.post,
	)

	return (
		<LayoutClient withContainer={list ? false : true}>
			<ListProvider initialList={list}>
				<ProgressProvider initialProgress={initialProgress}>
					<div className="flex flex-1">
						<ListResourceNavigation />
						<MobileListResourceNavigation />
						{props.children}
					</div>
				</ProgressProvider>
			</ListProvider>
		</LayoutClient>
	)
}
