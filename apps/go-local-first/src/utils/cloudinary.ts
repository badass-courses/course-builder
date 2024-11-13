import { env } from '@/env.mjs'

export const cloudinary = require('cloudinary').v2

cloudinary.config({
	cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
})
