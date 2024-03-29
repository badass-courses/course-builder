import config from '@/config'

export function getCommonMetadata({ title }: { title?: string }) {
	return {
		title: {
			defaultValue: title || 'Pro AWS by Adam Elmore',
			template: '%s | Pro AWS',
		},
		description: config.description,
	}
}
