import React from 'react'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror'

import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from './editor'

export function ReactCodemirror({
	value,
	onChange,
	theme = 'light',
}: {
	value: string
	onChange: (value: string) => void
	theme?: string
}) {
	const onViewUpdate = React.useCallback(
		(val: string, viewUpdate: ViewUpdate) => {
			console.log('val:', val)
			onChange(val)
		},
		[],
	)
	return (
		<CodeMirror
			value={value}
			height="100%"
			extensions={[markdown()]}
			onChange={onViewUpdate}
			theme={
				theme === 'dark'
					? CourseBuilderEditorThemeDark
					: CourseBuilderEditorThemeLight
			}
			basicSetup={{
				syntaxHighlighting: true,
				highlightSpecialChars: true,
			}}
		/>
	)
}
