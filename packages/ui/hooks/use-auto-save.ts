import React from 'react'

type AutoSaveOptions<T> = {
	onSave: (content: T) => Promise<T>
	getCurrentValue: () => T
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
export function useAutoSave<T>({
	onSave,
	getCurrentValue,
	inactivityTimeout = 2000,
}: AutoSaveOptions<T>) {
	const [isAutoSaving, setIsAutoSaving] = React.useState(false)
	const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
	const lastTypedRef = React.useRef<number>(Date.now())
	const latestContentRef = React.useRef<T>(getCurrentValue())

	const triggerAutoSave = React.useCallback(async () => {
		if (autoSaveTimerRef.current) {
			clearTimeout(autoSaveTimerRef.current)
		}

		lastTypedRef.current = Date.now()
		// Store latest content immediately
		latestContentRef.current = getCurrentValue()
		console.log({ latestContentRef })

		autoSaveTimerRef.current = setTimeout(async () => {
			if (Date.now() - lastTypedRef.current >= inactivityTimeout) {
				setIsAutoSaving(true)

				try {
					// Save with latest content at the time of save
					const currentContent = getCurrentValue()
					const savedContent = await onSave(currentContent)

					// Only update if server response differs and no new changes were made
					if (
						JSON.stringify(savedContent) !== JSON.stringify(currentContent) &&
						JSON.stringify(currentContent) === JSON.stringify(getCurrentValue())
					) {
						latestContentRef.current = savedContent
					}
				} finally {
					setIsAutoSaving(false)
				}
			}
		}, inactivityTimeout)
	}, [getCurrentValue, onSave, inactivityTimeout])

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
		latestContent: latestContentRef.current,
	}
}
