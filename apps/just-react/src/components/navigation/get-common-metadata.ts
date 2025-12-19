import config from '@/config'

export function getCommonMetadata({ title }: { title?: string }) {
	return {
		title: {
			defaultValue: title || `${config.defaultTitle} by ${config.author}`,
			template: `%s | ${config.defaultTitle}`,
		},
		description: config.description,
	}
}
