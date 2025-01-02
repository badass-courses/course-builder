import * as React from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditPostFormProps } from '@/app/(content)/posts/_components/edit-post-form'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { PostUpdate } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { EditorView } from '@codemirror/view'
import { useSession } from 'next-auth/react'
import { yCollab } from 'y-codemirror.jh'
import YPartyKitProvider from 'y-partykit/provider'
import useYProvider from 'y-partykit/react'
import * as Y from 'yjs'

import MarkdownEditor, { ICommand } from '@coursebuilder/react-markdown-editor'
import { Button, Form } from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

const defaultCommands = [
	'undo',
	'redo',
	'bold',
	'italic',
	'header',
	'strike',
	'underline',
	'quote',
	'olist',
	'ulist',
	'todo',
	'link',
	'image',
	'code',
	'codeBlock',
] as ICommand[]

export const MobileEditPostForm: React.FC<EditPostFormProps> = ({
	post,
	form,
	videoResourceLoader,
	availableWorkflows,
	theme = 'light',
	tagLoader,
}) => {
	const session = useSession()
	const videoResource = use(videoResourceLoader)
	const [updatePostStatus, setUpdatePostStatus] = React.useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [transcript, setTranscript] = React.useState<string | null>(
		videoResource?.transcript || null,
	)
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(post.resources?.[0]?.resource.id)
	const router = useRouter()

	useSocket({
		room: videoResourceId,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							setVideoResourceId(data.body.id)
						}

						router.refresh()

						break
					case 'transcript.ready':
						setTranscript(data.body)
						break

					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})

	const onSubmit = async (values: PostUpdate) => {
		const updatedPost = await updatePost({ ...values, id: post.id })
		setUpdatePostStatus('success')

		if (!updatedPost) {
			// handle edge case, e.g. toast an error message
		} else {
			const { fields: slug } = updatedPost

			router.push(`/${slug}`)
		}
	}

	const formValues = form.getValues()

	const onChange = React.useCallback((value: string, yDoc?: any) => {
		if (yDoc) {
			form.setValue('fields.yDoc', yDoc)
		}
		form.setValue('fields.body', value)
	}, [])

	return (
		<>
			<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
				<div className="flex items-center gap-2">
					<Button className="px-0" asChild variant="link">
						<Link href={`/${post?.fields.slug}`} className="aspect-square">
							←
						</Link>
					</Button>
					<span className="font-medium">
						Post{' '}
						<span className="hidden font-mono text-xs font-normal md:inline-block">
							({post.id})
						</span>
					</span>
				</div>
				<Button
					onClick={(e) => {
						setUpdatePostStatus('loading')
						onSubmit(form.getValues())
					}}
					type="button"
					size="sm"
					className="disabled:cursor-wait"
					disabled={updatePostStatus === 'loading'}
				>
					Save
				</Button>
			</div>
			<div className="flex flex-col">
				<Form {...form}>
					<form
						className="w-full"
						onSubmit={form.handleSubmit(onSubmit, (error) => {
							console.log({ error })
						})}
					>
						<div className="flex flex-col gap-8">
							<PostMetadataFormFields
								tagLoader={tagLoader}
								form={form}
								videoResourceLoader={videoResourceLoader}
								post={post}
								videoResourceId={videoResourceId}
							/>
						</div>
					</form>
				</Form>
				<div className="pt-5">
					<label className="px-5 text-lg font-bold">Contentz</label>
					<MarkdownEditor
						height="var(--code-editor-layout-height)"
						onYdocChange={(value, yDoc) => {
							onChange(value, yDoc)
						}}
						enablePreview={false}
						theme={
							(theme === 'dark'
								? CourseBuilderEditorThemeDark
								: CourseBuilderEditorThemeLight) || CourseBuilderEditorThemeDark
						}
						extensions={[EditorView.lineWrapping]}
						toolbars={[...defaultCommands]}
					/>
				</div>
			</div>
		</>
	)
}
