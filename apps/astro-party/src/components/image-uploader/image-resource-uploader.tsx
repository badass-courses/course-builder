import * as React from 'react'
import { CloudinaryUploadButton } from '@/components/image-uploader/cloudinary-upload-button'
import { ImageResourceBrowser } from '@/components/image-uploader/image-resource-browser'

import { ScrollArea } from '@coursebuilder/ui'

export function ImageResourceUploader(props: {
	uploadDirectory: string
	belongsToResourceId: string
}) {
	return (
		<ScrollArea className="h-(--pane-layout-height) overflow-y-auto">
			<CloudinaryUploadButton
				dir={props.uploadDirectory}
				id={props.belongsToResourceId}
			/>
			<ImageResourceBrowser />
		</ScrollArea>
	)
}
