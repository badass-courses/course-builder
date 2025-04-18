'use client'

import React, { useState } from 'react'
import { AnnotationHandler } from 'codehike/code'

const InlineFold: AnnotationHandler['Inline'] = ({ children }) => {
	const [folded, setFolded] = useState(true)
	if (!folded) {
		return children
	}
	return (
		<button onClick={() => setFolded(false)} aria-label="Expand">
			...
		</button>
	)
}

export const fold: AnnotationHandler = {
	name: 'fold',
	Inline: InlineFold,
}
