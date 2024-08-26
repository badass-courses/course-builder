import * as React from 'react'
import { CloudinaryUploadButton } from '@/components/image-uploader/cloudinary-upload-button'
import { DownloadableImageResourceBrowser } from '@/components/image-uploader/downloadable-image-resource-browser'

import { ScrollArea } from '@coursebuilder/ui'

export function DownloadableImageResourceUploader(props: {
	uploadDirectory: string
	belongsToResourceId: string
}) {
	return (
		<>
			<div>
				<h2>Downloadable Media</h2>
			</div>
			<ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
				<CloudinaryUploadButton
					dir={props.uploadDirectory}
					id={props.belongsToResourceId}
					is_downloadable={true}
				/>
				<React.Suspense fallback={<div>Loading...</div>}>
					<DownloadableImageResourceBrowser
						resourceId={props.belongsToResourceId}
					/>
				</React.Suspense>
			</ScrollArea>
		</>
	)
}
