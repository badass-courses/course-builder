import {getUniqueFilename} from '@/lib/get-unique-filename'
import {UploadDropzone} from '@/utils/uploadthing'
import * as React from 'react'
import {api} from '@/trpc/react'

export function TipUploader({
  setVideoResourceId,
}: {
  setVideoResourceId: (value: string) => void
}) {
  const utils = api.useUtils()
  return (
    <div>
      <UploadDropzone
        endpoint="tipUploader"
        config={{
          mode: 'auto',
        }}
        onBeforeUploadBegin={(files) => {
          return files.map(
            (file) =>
              new File([file], getUniqueFilename(file.name), {type: file.type}),
          )
        }}
        onClientUploadComplete={async (response: any) => {
          if (response[0].fileName) setVideoResourceId(response[0].fileName)
          await utils.module.getBySlug.invalidate({slug: 'tips'})
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`)
        }}
      />
    </div>
  )
}
