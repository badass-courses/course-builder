export const getEmoji = (emotion?: string) => {
	switch (emotion) {
		case ':heart_eyes:':
			return { image: '😍', label: 'smiling face with heart-eyes' }
		case ':sob:':
			return { image: '😭', label: 'loudly crying face' }
		case ':unicorn_face:':
			return { image: '🦄', label: 'unicorn' }
		case ':wave:':
			return { image: '👋', label: 'wave hello' }
		default:
			return { image: '😐', label: 'neutral face' }
	}
}
