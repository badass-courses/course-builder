import type { ResourceProgress } from '@coursebuilder/core/schemas'

export type Achievement = {
	id: string
	name: string
	description: string
	icon: string
	check: (progress: ResourceProgress[]) => boolean
}

export const achievements: Achievement[] = [
	{
		id: 'first-completion',
		name: 'First Steps',
		description: 'Complete your first resource',
		icon: '🎯',
		check: (progress) => progress.length >= 1,
	},
	{
		id: 'ten-completions',
		name: 'Getting Started',
		description: 'Complete 10 resources',
		icon: '🌟',
		check: (progress) => progress.length >= 10,
	},
	{
		id: 'quick-learner',
		name: 'Quick Learner',
		description: 'Complete 5 resources in a single day',
		icon: '⚡',
		check: (progress) => {
			const byDate = progress.reduce(
				(acc, p) => {
					const date = new Date(p.completedAt!).toDateString()
					acc[date] = (acc[date] || 0) + 1
					return acc
				},
				{} as Record<string, number>,
			)
			return Object.values(byDate).some((count) => count >= 5)
		},
	},
	{
		id: 'night-owl',
		name: 'Night Owl',
		description: 'Complete a resource between midnight and 5am',
		icon: '🦉',
		check: (progress) =>
			progress.some((p) => {
				const hour = new Date(p.completedAt!).getHours()
				return hour >= 0 && hour < 5
			}),
	},
]
