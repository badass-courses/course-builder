'use client'

import { useEffect, useState } from 'react'
import { getCheckboxState, setCheckboxState } from '@/utils/checkbox-storage'
import { cn } from '@/utils/cn'
import { Check } from 'lucide-react'

/**
 * Persistent checkbox for MDX content.
 * State is stored in browser IndexedDB and survives page refreshes.
 */
export function MDXCheckbox({
	lessonId,
	index,
	...props
}: {
	lessonId: string
	index: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked'>) {
	const checkboxId = `${lessonId}-checkbox-${index}`
	const [checked, setChecked] = useState(false)

	// Load state from IndexedDB on mount
	useEffect(() => {
		let mounted = true

		getCheckboxState(checkboxId).then((savedState) => {
			if (mounted && savedState !== null) {
				setChecked(savedState)
			}
		})

		return () => {
			mounted = false
		}
	}, [checkboxId])

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newChecked = e.target.checked
		setChecked(newChecked)
		await setCheckboxState(checkboxId, newChecked)
	}

	return (
		<label className="group relative mr-1 inline-flex translate-y-2.5 items-center justify-center hover:cursor-pointer">
			<input
				{...props}
				type="checkbox"
				className={cn(
					'border-foreground/20 bg-background hover:border-primary hover:shadow-primary/20 dark:bg-input/30 checked:border-primary checked:bg-primary checked:shadow-primary/30 dark:checked:bg-primary focus-visible:ring-ring peer relative size-8 shrink-0 appearance-none rounded-full border-2 transition-all duration-200 checked:shadow-md hover:scale-110 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				)}
				checked={checked}
				onChange={handleChange}
				disabled={false}
			/>
			<Check className="peer-checked:text-primary-foreground text-foreground pointer-events-none absolute size-6 opacity-20 transition-all duration-200 group-hover:opacity-30 peer-checked:opacity-100" />
		</label>
	)
}
