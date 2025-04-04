'use client'

import React, { createContext, ReactNode, use, useState } from 'react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

interface MDXPreviewContextProps {
	editorValue: string | null
	setEditorValue: (text: string) => void
	mdxContent: MDXRemoteSerializeResult | undefined
	setMdxContent: (result: MDXRemoteSerializeResult | undefined) => void
	togglePreviewPanel: () => void
	isShowingMdxPreview: boolean
}

const MDXPreviewContext = createContext<MDXPreviewContextProps | undefined>(
	undefined,
)

export const useMDXPreview = () => {
	const context = use(MDXPreviewContext)
	if (!context) {
		throw new Error('useMDXPreview must be used within a MDXPreviewProvider')
	}
	return context
}

interface MDXPreviewProviderProps {
	children: ReactNode
	initialValue?: string | null
}

export const MDXPreviewProvider: React.FC<MDXPreviewProviderProps> = ({
	children,
	initialValue = '',
}) => {
	const [editorValue, setEditorValue] = useState<string | null>(initialValue)
	const [mdxContent, setMdxContent] = useState<
		MDXRemoteSerializeResult | undefined
	>()
	const [isShowingMdxPreview, setShowMDXPreview] = useState(false)
	function togglePreviewPanel() {
		setShowMDXPreview((prev) => !prev)
	}

	return (
		<MDXPreviewContext.Provider
			value={{
				editorValue,
				setEditorValue,
				mdxContent,
				setMdxContent,
				togglePreviewPanel,
				isShowingMdxPreview,
			}}
		>
			{children}
		</MDXPreviewContext.Provider>
	)
}
