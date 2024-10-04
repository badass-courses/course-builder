'use client'

import React from 'react'
import type { CldImageProps } from 'next-cloudinary'
import { CldImage as CldImage_ } from 'next-cloudinary'

export const CldImage: React.FC<CldImageProps> = (props) => {
	return <CldImage_ {...props} />
}
