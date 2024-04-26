'use client'

import { useRouter } from 'next/navigation'
import { createTip } from '@/lib/tips-query'
import { getVideoResource } from '@/lib/video-resource-query'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'
import { NewResourceWithVideoForm } from '@coursebuilder/react-rsc/client'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

import { TipUploader } from './tip-uploader'

export function CreateTip() {
	const router = useRouter()
	return (
		<div className="mt-8 w-full max-w-screen-md border-t border-dashed pb-5 pt-8 md:p-5 md:pt-5 [&_form]:flex [&_form]:flex-col [&_form]:gap-3 [&_label]:text-base">
			<strong className="font-heading mb-3 flex text-3xl font-bold">
				Create New Tip
			</strong>
			<NewResourceWithVideoForm
				onResourceCreated={async (resource: ContentResource) => {
					router.push(
						`/${pluralize(resource.type)}/${resource.fields?.slug || resource.id}/edit`,
					)
				}}
				createResource={createTip}
				getVideoResource={getVideoResource}
			>
				{(handleSetVideoResourceId: (id: string) => void) => {
					return <TipUploader setVideoResourceId={handleSetVideoResourceId} />
				}}
			</NewResourceWithVideoForm>
		</div>
	)
}
