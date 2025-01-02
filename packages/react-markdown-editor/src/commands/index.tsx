import { ReactCodeMirrorRef } from '@uiw/react-codemirror'

import { IMarkdownEditor, ToolBarProps } from '..'
import { bold } from './bold'
import { code, codeBlock } from './code'
import { fullscreen } from './fullscreen'
import { header } from './header'
import { image } from './image'
import { italic } from './italic'
import { link } from './link'
import { olist } from './olist'
import { preview } from './preview'
import { quote } from './quote'
import { redo } from './redo'
import { strike } from './strike'
import { todo } from './todo'
import { ulist } from './ulist'
import { underline } from './underline'
import { undo } from './undo'

export type ButtonHandle = (
	command: ICommand,
	props: IMarkdownEditor,
	options: ToolBarProps,
) => JSX.Element

export type ICommand = {
	icon?: React.ReactElement
	name?: string
	keyCommand?: string
	button?: ButtonHandle | React.ButtonHTMLAttributes<HTMLButtonElement>
	execute?: (editor: ReactCodeMirrorRef) => void
}

export const defaultCommands = {
	undo,
	redo,
	bold,
	italic,
	header,
	strike,
	underline,
	quote,
	olist,
	ulist,
	todo,
	link,
	image,
	code,
	codeBlock,
	fullscreen,
	preview,
}

export const getCommands: () => ICommand[] = () =>
	Object.keys(defaultCommands)
		.filter((key) => !/^(fullscreen|preview)/.test(key))
		.map((key) => defaultCommands[key as keyof typeof defaultCommands])

export const getModeCommands: () => ICommand[] = () => [preview, fullscreen]

export {
	bold,
	code,
	codeBlock,
	italic,
	header,
	strike,
	underline,
	olist,
	ulist,
	quote,
	link,
	todo,
	image,
	redo,
	undo,
	fullscreen,
	preview,
}
