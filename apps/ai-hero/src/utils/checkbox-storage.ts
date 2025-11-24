import Dexie, { type Table } from 'dexie'

/**
 * Checkbox state stored in IndexedDB
 */
export interface CheckboxState {
	id: string
	checked: boolean
	lessonId: string
	updatedAt: number
}

/**
 * Initialize Dexie database for checkbox persistence
 */
function initDB() {
	if (typeof window === 'undefined') return null

	const database = new Dexie('ai-hero-checkboxes') as Dexie & {
		checkboxStates: Table<CheckboxState>
	}

	database.version(1).stores({
		checkboxStates: 'id, lessonId, updatedAt',
	})

	return database
}

export const db = initDB()

/**
 * Get checkbox state from IndexedDB
 */
export async function getCheckboxState(
	checkboxId: string,
): Promise<boolean | null> {
	if (!db) return null

	try {
		const state = await db.checkboxStates.get(checkboxId)
		return state?.checked ?? null
	} catch (error) {
		console.error('Failed to get checkbox state:', error)
		return null
	}
}

/**
 * Save checkbox state to IndexedDB
 */
export async function setCheckboxState(
	checkboxId: string,
	checked: boolean,
): Promise<void> {
	if (!db) return

	try {
		const lessonId = checkboxId.split('-checkbox-')[0] || ''
		await db.checkboxStates.put({
			id: checkboxId,
			checked,
			lessonId,
			updatedAt: Date.now(),
		})
	} catch (error) {
		console.error('Failed to save checkbox state:', error)
	}
}
