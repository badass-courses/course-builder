export function getCommonMetadata({ title }: { title?: string }) {
	return {
		title: {
			defaultValue: title || 'Pro AWS by Adam Elmore',
			template: '%s | Pro AWS',
		},
		description:
			"Course Builder is a framework for building courses. It's not a course platform. It's not a course marketplace. It's all of the pieces that you need to launch your own course platform and marketplace.",
	}
}
