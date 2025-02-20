import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditPostFormProps } from '@/app/(content)/posts/_components/edit-post-form'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { env } from '@/env.mjs'
import { PostUpdate } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { api } from '@/trpc/react'
import { EditorView } from '@codemirror/view'
import MarkdownEditor, { ICommand } from '@uiw/react-markdown-editor'
import { useSession } from 'next-auth/react'
import YPartyKitProvider from 'y-partykit/provider'
import * as Y from 'yjs'

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
	availableWorkflows,
	videoResourceId,
	theme = 'light',
	tagLoader,
	listsLoader,
	sendResourceChatMessage,
}) => {
	const session = useSession()
	const { data: videoResource, refetch } = api.videoResources.get.useQuery({
		videoResourceId: videoResourceId,
	})
	const [updatePostStatus, setUpdatePostStatus] = React.useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [transcript, setTranscript] = React.useState<string | null>(
		videoResource?.transcript || null,
	)

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

	const partyKitProviderRef = React.useRef<YPartyKitProvider | null>(null)
	const ytext =
		partyKitProviderRef.current?.doc.getText('codemirror') ||
		new Y.Doc().getText('codemirror')

	console.log({
		url: env.NEXT_PUBLIC_PARTY_KIT_URL,
		resourceId: post.id,
		ytext,
	})

	React.useEffect(() => {
		partyKitProviderRef.current = new YPartyKitProvider(
			env.NEXT_PUBLIC_PARTY_KIT_URL,
			post.id,
			ytext.doc || new Y.Doc(),
		)
		return () => {
			partyKitProviderRef.current?.destroy()
		}
	}, [post.id])

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
								sendResourceChatMessage={sendResourceChatMessage}
								listsLoader={listsLoader}
								tagLoader={tagLoader}
								form={form}
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
						value={post.fields.body || ''}
						onChange={(value, viewUpdate) => {
							const yDoc = Buffer.from(
								Y.encodeStateAsUpdate(partyKitProviderRef.current!.doc),
							).toString('base64')
							onChange(value, yDoc)
						}}
						enablePreview={false}
						theme={
							(theme === 'dark'
								? CourseBuilderEditorThemeDark
								: CourseBuilderEditorThemeLight) || CourseBuilderEditorThemeDark
						}
						extensions={[
							EditorView.lineWrapping,
							// ...(partyKitProviderRef.current
							// 	? [yCollab(ytext, partyKitProviderRef.current.awareness)]
							// 	: []),
						]}
						toolbars={[...defaultCommands]}
					/>
				</div>
			</div>
		</>
	)
}
