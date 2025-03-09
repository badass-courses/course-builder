import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines and merges multiple class names or class name arrays into a single string.
 * Uses clsx to combine classes and tailwind-merge to handle Tailwind CSS class conflicts.
 *
 * @param inputs - Any number of class values (strings, objects, arrays)
 * @returns A string of merged class names with Tailwind conflicts resolved
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'
 *
 * // With conditional classes
 * cn('text-red-500', isActive && 'bg-blue-500') // 'text-red-500 bg-blue-500' if isActive is true
 *
 * // With Tailwind conflicts resolved
 * cn('text-red-500', 'text-blue-500') // 'text-blue-500' (last class wins)
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
