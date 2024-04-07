'use client'

import { useRouter } from 'next/navigation'
import { TipUploader } from '@/app/(content)/tips/_components/tip-uploader'
import { createTip } from '@/lib/tips-query'
import { getVideoResource } from '@/lib/video-resource-query'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'
import { NewResourceWithVideoForm } from '@coursebuilder/react-rsc/client'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreateTip() {
	const router = useRouter()
	return (
		<Card>
			<CardContent>
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
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
