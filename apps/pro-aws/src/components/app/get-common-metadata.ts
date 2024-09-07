import config from '@/config'

export function getCommonMetadata({ title }: { title?: string }) {
	return {
		title: {
			defaultValue: title || 'ProAWS by Adam Elmore',
			template: '%s | ProAWS',
		},
		description: config.description,
	}
}
