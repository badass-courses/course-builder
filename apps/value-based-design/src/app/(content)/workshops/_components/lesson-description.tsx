import Link from 'next/link'
import { AbilityForResource } from '@/utils/get-current-ability-rules'
import { codeToHtml } from '@/utils/shiki'
import { MDXRemote } from 'next-mdx-remote/rsc'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { take } from '@coursebuilder/nodash'

export async function LessonDescription({
	lesson,
	abilityLoader,
}: {
	lesson: ContentResource
	abilityLoader?: Promise<AbilityForResource>
}) {
	const ability = await abilityLoader
	const canView = ability?.canView

	const displayedBody = canView
		? lesson.fields?.body
		: take(lesson.fields?.body.split('\n'), 10).join('\n')

	return (
		lesson.fields?.body && (
			<div className="prose mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
				<div className="relative">
					<MDXRemote
						source={displayedBody}
						components={{
							// @ts-expect-error
							pre: async (props: any) => {
								const children = props?.children.props.children
								const language =
									props?.children.props.className?.split('-')[1] || 'typescript'
								try {
									const html = await codeToHtml({ code: children, language })
									return <div dangerouslySetInnerHTML={{ __html: html }} />
								} catch (error) {
									console.error(error)
									return <pre {...props} />
								}
							},
						}}
					/>
					{!canView && (
						<div className="from-background absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />
					)}
				</div>
				{!canView && (
					<div className="flex translate-y-4 items-center justify-center rounded border border-black bg-black  p-5 shadow-2xl before:absolute before:top-[-8px] before:h-4 before:w-4 before:rotate-45 before:border-l before:border-t before:border-black before:bg-black  before:content-['']">
						<p className="text-white">
							This {lesson?.type} is part of{' '}
							<Link className="text-white" href={'/buy'}>
								Value-Based Design Fundamentals
							</Link>{' '}
							and can be unlocked immediately after purchase. Already purchased?{' '}
							<Link className="text-white" href="/login">
								Log in here.
							</Link>
						</p>
					</div>
				)}
			</div>
		)
	)
}
