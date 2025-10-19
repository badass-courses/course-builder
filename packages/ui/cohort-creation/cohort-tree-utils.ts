/**
 * Tree utilities for cohort workshop list management
 * Simplified for ordered workshop selection
 */

export type WorkshopItem = {
	id: string
	label?: string
	fields?: {
		title?: string
		slug?: string
	}
}

export type WorkshopListState = {
	lastAction: WorkshopListAction | null
	data: WorkshopItem[]
}

export function getInitialWorkshopListState(
	initialData?: WorkshopItem[],
): WorkshopListState {
	return { data: initialData ?? [], lastAction: null }
}

export type WorkshopListAction =
	| {
			type: 'add-workshop'
			workshop: WorkshopItem
	  }
	| {
			type: 'remove-workshop'
			workshopId: string
	  }
	| {
			type: 'move-workshop'
			workshopId: string
			direction: 'up' | 'down'
	  }
	| {
			type: 'reorder-workshops'
			workshops: WorkshopItem[]
	  }

export function workshopListReducer(
	state: WorkshopListState,
	action: WorkshopListAction,
): WorkshopListState {
	return {
		data: dataReducer(state.data, action),
		lastAction: action,
	}
}

const dataReducer = (
	data: WorkshopItem[],
	action: WorkshopListAction,
): WorkshopItem[] => {
	if (action.type === 'add-workshop') {
		// Don't add duplicates
		if (data.find((w) => w.id === action.workshop.id)) {
			return data
		}
		return [...data, action.workshop]
	}

	if (action.type === 'remove-workshop') {
		return data.filter((w) => w.id !== action.workshopId)
	}

	if (action.type === 'move-workshop') {
		const index = data.findIndex((w) => w.id === action.workshopId)
		if (index === -1) return data

		const newData = [...data]
		if (action.direction === 'up' && index > 0) {
			;[newData[index - 1], newData[index]] = [
				newData[index],
				newData[index - 1],
			]
		} else if (action.direction === 'down' && index < data.length - 1) {
			;[newData[index], newData[index + 1]] = [
				newData[index + 1],
				newData[index],
			]
		}
		return newData
	}

	if (action.type === 'reorder-workshops') {
		return action.workshops
	}

	return data
}
