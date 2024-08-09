import { type OurFileRouter } from '@/uploadthing/core'
import {
	generateComponents,
	generateUploadButton,
	generateUploadDropzone,
} from '@uploadthing/react'
import { generateReactHelpers } from '@uploadthing/react/hooks'

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
