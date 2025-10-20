/**
 * Tree utilities for workshop structure management
 * Simplified version adapted from list editor tree for workshop creation
 */

export type TreeItem = {
	id: string
	label?: string
	type?: 'section' | 'lesson'
	children: TreeItem[]
	isOpen?: boolean
	videoResourceId?: string
}

export type TreeState = {
	lastAction: TreeAction | null
	data: TreeItem[]
}

export function getInitialTreeState(initialData?: TreeItem[]): TreeState {
	return { data: initialData ?? [], lastAction: null }
}

export type TreeAction =
	| {
			type: 'add-section'
			title: string
	  }
	| {
			type: 'add-lesson'
			title: string
			parentId?: string // if provided, adds to section
			videoResourceId?: string
	  }
	| {
			type: 'remove-item'
			itemId: string
	  }
	| {
			type: 'update-item'
			itemId: string
			fields: Partial<Pick<TreeItem, 'label' | 'videoResourceId'>>
	  }
	| {
			type: 'toggle'
			itemId: string
	  }
	| {
			type: 'move-item'
			itemId: string
			targetId: string
			position: 'before' | 'after' | 'child'
	  }

export const tree = {
	remove(data: TreeItem[], id: string): TreeItem[] {
		return data
			.filter((item) => item.id !== id)
			.map((item) => {
				if (tree.hasChildren(item)) {
					return {
						...item,
						children: tree.remove(item.children, id),
					}
				}
				return item
			})
	},
	insertBefore(
		data: TreeItem[],
		targetId: string,
		newItem: TreeItem,
	): TreeItem[] {
		return data.flatMap((item) => {
			if (item.id === targetId) {
				return [newItem, item]
			}
			if (tree.hasChildren(item)) {
				return {
					...item,
					children: tree.insertBefore(item.children, targetId, newItem),
				}
			}
			return item
		})
	},
	insertAfter(
		data: TreeItem[],
		targetId: string,
		newItem: TreeItem,
	): TreeItem[] {
		return data.flatMap((item) => {
			if (item.id === targetId) {
				return [item, newItem]
			}

			if (tree.hasChildren(item)) {
				return {
					...item,
					children: tree.insertAfter(item.children, targetId, newItem),
				}
			}

			return item
		})
	},
	insertChild(
		data: TreeItem[],
		targetId: string,
		newItem: TreeItem,
	): TreeItem[] {
		return data.flatMap((item) => {
			if (item.id === targetId) {
				return {
					...item,
					isOpen: true,
					children: [newItem, ...item.children],
				}
			}

			if (!tree.hasChildren(item)) {
				return item
			}

			return {
				...item,
				children: tree.insertChild(item.children, targetId, newItem),
			}
		})
	},
	find(data: TreeItem[], itemId: string): TreeItem | undefined {
		for (const item of data) {
			if (item.id === itemId) {
				return item
			}

			if (tree.hasChildren(item)) {
				const result = tree.find(item.children, itemId)
				if (result) {
					return result
				}
			}
		}
	},
	hasChildren(item: TreeItem): boolean {
		return item.children.length > 0
	},
}

export function treeStateReducer(
	state: TreeState,
	action: TreeAction,
): TreeState {
	return {
		data: dataReducer(state.data, action),
		lastAction: action,
	}
}

const dataReducer = (data: TreeItem[], action: TreeAction): TreeItem[] => {
	if (action.type === 'add-section') {
		const newSection: TreeItem = {
			id: `section-${Date.now()}`,
			label: action.title,
			type: 'section',
			children: [],
			isOpen: true,
		}
		return [...data, newSection]
	}

	if (action.type === 'add-lesson') {
		const newLesson: TreeItem = {
			id: `lesson-${Date.now()}`,
			label: action.title,
			type: 'lesson',
			children: [],
			videoResourceId: action.videoResourceId,
		}

		if (action.parentId) {
			// Add to section
			return tree.insertChild(data, action.parentId, newLesson)
		} else {
			// Add as top-level
			return [...data, newLesson]
		}
	}

	if (action.type === 'remove-item') {
		return tree.remove(data, action.itemId)
	}

	if (action.type === 'update-item') {
		const { itemId, fields } = action
		function updateRecursively(items: TreeItem[]): TreeItem[] {
			return items.map((item) => {
				if (item.id === itemId) {
					return {
						...item,
						...fields,
					}
				}

				if (item.children.length > 0) {
					return {
						...item,
						children: updateRecursively(item.children),
					}
				}

				return item
			})
		}

		return updateRecursively(data)
	}

	if (action.type === 'toggle') {
		const { itemId } = action
		function toggle(item: TreeItem): TreeItem {
			if (!tree.hasChildren(item)) {
				return item
			}

			if (item.id === itemId) {
				return { ...item, isOpen: !item.isOpen }
			}

			return { ...item, children: item.children.map(toggle) }
		}

		return data.map(toggle)
	}

	if (action.type === 'move-item') {
		const item = tree.find(data, action.itemId)
		if (!item) return data

		let result = tree.remove(data, action.itemId)

		if (action.position === 'before') {
			result = tree.insertBefore(result, action.targetId, item)
		} else if (action.position === 'after') {
			result = tree.insertAfter(result, action.targetId, item)
		} else if (action.position === 'child') {
			result = tree.insertChild(result, action.targetId, item)
		}

		return result
	}

	return data
}
