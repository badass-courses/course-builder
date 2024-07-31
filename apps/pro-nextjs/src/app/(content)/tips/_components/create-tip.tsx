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
		<div className="mt-8 w-full max-w-screen-md border-t p-5 pb-5 pt-8 md:p-8 md:pt-5 [&_form]:flex [&_form]:flex-col [&_form]:gap-3 [&_label]:text-base">
			<strong className="mb-3 flex text-xl font-semibold">
				Create New Tip
			</strong>
			<NewResourceWithVideoForm
				availableResourceTypes={['tip']}
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
