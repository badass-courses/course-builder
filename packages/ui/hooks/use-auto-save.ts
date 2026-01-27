import React from 'react'

type AutoSaveOptions = {
	onSave: () => Promise<void>
	inactivityTimeout?: number
}

/**
 * A hook that provides auto-save functionality with a debounce mechanism.
 *
 * @param options - The configuration options for auto-save behavior
 * @param options.onSave - Callback function to be executed when auto-save is triggered
 * @param options.inactivityTimeout - Time in milliseconds to wait after the last change before triggering auto-save (default: 2000ms)
 *
 * @returns An object containing:
 * - isAutoSaving: Boolean indicating whether auto-save is currently in progress
 * - triggerAutoSave: Function to manually trigger the auto-save mechanism
 *
 * @example
 * ```tsx
 * const { isAutoSaving, triggerAutoSave } = useAutoSave({
 *   onSave: async () => { await saveData() },
 *   inactivityTimeout: 1000
 * });
 * ```
 */
export function useAutoSave({
	onSave,
	inactivityTimeout = 2000,
}: AutoSaveOptions) {
	// Track save state and maintain timer references
	const [isAutoSaving, setIsAutoSaving] = React.useState(false)
	const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
	const lastTypedRef = React.useRef<number>(0)

	const triggerAutoSave = React.useCallback(() => {
		// Reset existing timer to prevent multiple concurrent saves
		if (autoSaveTimerRef.current) {
			clearTimeout(autoSaveTimerRef.current)
		}

		// Update timestamp for inactivity tracking
		lastTypedRef.current = Date.now()

		autoSaveTimerRef.current = setTimeout(async () => {
			// Double-check inactivity duration to prevent premature saves
			// that might occur due to React's state batching
			if (Date.now() - lastTypedRef.current >= inactivityTimeout) {
				setIsAutoSaving(true)
				await onSave()
				setIsAutoSaving(false)
			}
		}, inactivityTimeout)
	}, [onSave, inactivityTimeout])

	// Cleanup timer on unmount to prevent memory leaks
	React.useEffect(() => {
		return () => {
			if (autoSaveTimerRef.current) {
				clearTimeout(autoSaveTimerRef.current)
			}
		}
	}, [])

	return {
		isAutoSaving,
		triggerAutoSave,
	}
}
