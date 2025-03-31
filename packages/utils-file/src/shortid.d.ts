declare module 'shortid' {
	export function generate(): string
	export function seed(num: number): void
	export function characters(string: string): string
	export const version: string
}
