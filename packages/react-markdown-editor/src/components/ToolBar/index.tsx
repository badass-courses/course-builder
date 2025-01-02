import React, { Fragment } from 'react'

import { IMarkdownEditor, ToolBarProps } from '../..'
import { defaultCommands, type ICommand } from '../../commands'

import './index.less'

export type Commands = keyof typeof defaultCommands | ICommand

export interface IToolBarProps<T = Commands> extends ToolBarProps {
	className?: string
	editorProps: IMarkdownEditor
	mode?: boolean
	prefixCls?: string
	toolbars?: T[]
	onClick?: (type: string) => void
}

export default function ToolBar(props: IToolBarProps) {
	const {
		prefixCls = 'md-editor',
		className,
		onClick,
		toolbars = [],
		editor,
		mode,
		preview,
		container,
		containerEditor,
		editorProps = {},
		...htmlProps
	} = props
	if (!toolbars || toolbars.length === 0) return null
	function handleClick(execute: ICommand['execute']) {
		if (execute && editor && editor) {
			execute(editor.current!)
		}
	}
	editorProps.prefixCls = prefixCls
	return (
		<div
			className={`${prefixCls}-toolbar ${className || ''} ${mode ? `${prefixCls}-toolbar-mode` : ''}`}
			{...htmlProps}
		>
			{[...toolbars].map((command, key) => {
				let buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
					type: 'button',
				}
				const obj =
					typeof command === 'string' ? defaultCommands[command] : command
				if (!obj) return null
				buttonProps.children = obj.icon
				buttonProps.onClick = () => handleClick(obj.execute)
				if (obj.button && typeof obj.button === 'object') {
					const btn: React.ButtonHTMLAttributes<HTMLButtonElement> = obj.button
					;(
						Object.keys(
							btn,
						) as (keyof React.ButtonHTMLAttributes<HTMLButtonElement>)[]
					).forEach((key) => {
						buttonProps[key] = btn[key]
					})
				} else if (typeof obj.button === 'function') {
					const CustomButton = obj.button(obj, editorProps, {
						preview,
						container,
						containerEditor,
						editor,
						editorProps,
					})
					return <Fragment key={key}>{CustomButton}</Fragment>
				}
				return <button {...buttonProps} key={key} />
			})}
		</div>
	)
}
