import { SyntheticEvent, useContext } from 'react'
import * as React from 'react'

import { component } from '../model/components'
import { Node } from '../model/mod'
import { Picker } from '../ui/picker'
import { Path } from '../workbench/path'
import { Template } from './template'

const TagBadge = ({
	node,
	tagName,
	onRemove,
}: {
	node: Node
	tagName: string
	onRemove: (tagName: string) => void
}) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Backspace') {
			onRemove(tagName)
		}
	}

	return (
		<div
			tabIndex={1}
			className="badge flex flex-row items-center"
			onKeyDown={handleKeyDown}
		>
			<span># </span>
			<div style={{ whiteSpace: 'nowrap' }}>{tagName}</div>
		</div>
	)
}

export const useTag = () => {
	const addTag = (node: Node, tagName: string) => {
		// Logic to add a tag to a node
		// Update the node accordingly
	}

	const findAllTags = () => {
		// Logic to find all tags in the workspace
	}

	const findTaggedNodes = (tagName: string) => {
		// Logic to find all nodes tagged with a specific name
	}

	const showPopover = (path: Path, node: Node, inputView: any, closer: any) => {
		// Logic to show a popover for tag selection
	}

	return { addTag, findAllTags, findTaggedNodes, showPopover }
}
