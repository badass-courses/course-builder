import { type OurFileRouter } from '@/uploadthing/core'
import {
	generateReactHelpers,
	generateUploadButton,
	generateUploadDropzone,
} from '@uploadthing/react'

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
