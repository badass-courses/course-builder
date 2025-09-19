'use client'

import Link from 'next/link'
import { List } from '@/lib/lists'
import { Post } from '@/lib/posts'
import { ListOrderedIcon, Pencil, PlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import pluralize from 'pluralize'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

import CreateNewEventDialog from '../../events/_components/create-new-event-dialog'
import { CreatePostModal } from './create-post-modal'

export function PostActions({
	allPosts,
	allLists,
}: {
	allPosts: Post[]
	allLists: List[]
}) {
	const { data: session } = useSession()
	const publishedPublicPosts = [...allPosts, ...allLists]
		.filter(
			(post) =>
				post.fields.visibility === 'public' &&
				post.fields.state === 'published',
		)
		.sort((a, b) => {
			return b.createdAt && a.createdAt
				? new Date(b.createdAt).getTime() - new Date(a?.createdAt).getTime()
				: 0
		})

	const unpublishedPosts = allPosts.filter((post) => {
		return !publishedPublicPosts.includes(post) && post.type === 'post'
	})

	const drafts = unpublishedPosts?.filter(
		({ fields }) =>
			fields.state === 'draft' && fields.visibility !== 'unlisted',
	)
	const unlisted = unpublishedPosts?.filter(
		({ fields }) => fields.visibility === 'unlisted',
	)

	return (
		<aside className="divide-border dark:bg-card bottom-5 right-5 z-20 my-5 w-full gap-3 divide-y rounded border bg-white shadow-md lg:fixed lg:my-0 lg:w-64">
			<div className="p-5 py-3">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>

				{drafts && drafts?.length > 0 ? (
					<p className="text-sm opacity-75">
						You have <strong className="font-semibold">{drafts?.length}</strong>{' '}
						unpublished{' '}
						{drafts?.length ? pluralize('post', drafts.length) : 'post'}.
					</p>
				) : (
					<p className="opacity-75">
						You've published {publishedPublicPosts.length} posts.
					</p>
				)}
			</div>
			{drafts && drafts.length > 0 ? (
				<ul className="flex max-h-[300px] flex-col overflow-y-auto px-5 pt-4">
					<strong>Drafts</strong>
					{drafts.map((post) => {
						return (
							<li key={post.id}>
								<Link
									className="group flex flex-col py-2"
									href={`/posts/${post.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<Pencil className="text-muted-foreground h-3 w-3 flex-shrink-0" />
										<span>{post.fields.title}</span>
									</strong>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{unlisted && unlisted.length > 0 ? (
				<Accordion
					type="single"
					collapsible
					className="px-5 py-4 [&>div]:border-b-0"
				>
					<AccordionItem value="unlisted">
						<AccordionTrigger className="hover:bg-muted/50 dark:hover:bg-muted/30">
							<strong>Unlisted ({unlisted.length})</strong>
						</AccordionTrigger>
						<AccordionContent>
							<ul className="flex max-h-[200px] flex-col overflow-y-auto">
								{unlisted.map((post) => {
									const postLists =
										allLists &&
										allLists.filter((list) =>
											list.resources.some(
												({ resource }) => resource.id === post.id,
											),
										)

									return (
										<li key={post.id}>
											<Link
												className="group flex flex-col pt-2"
												href={`/posts/${post.fields.slug}/edit`}
											>
												<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
													<span>{post.fields.title}</span>
												</strong>
											</Link>
											<div className="text-muted-foreground flex flex-col gap-1 pb-2 text-sm">
												{postLists &&
													postLists.map((postList) => (
														<Link
															key={postList.id}
															href={`/lists/${postList?.fields.slug}/edit`}
															className="text-muted-foreground hover:text-primary flex items-center gap-1"
														>
															<ListOrderedIcon className="w-3" />
															{postList && postList.fields.title}
														</Link>
													))}
											</div>
										</li>
									)
								})}
							</ul>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			) : null}
			<div className="px-5 py-4">
				<CreatePostModal
					availableResourceTypes={['article']}
					defaultResourceType="article"
					topLevelResourceTypes={['post']}
				/>
				<CreateNewEventDialog
					className="mt-1 w-full"
					variant="outline"
					buttonLabel={
						<>
							<PlusIcon className="mr-0.5 size-4" /> New event
						</>
					}
				/>
			</div>
		</aside>
	)
}
