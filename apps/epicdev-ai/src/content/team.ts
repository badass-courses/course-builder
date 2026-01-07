/**
 * Team member data for the credits page
 * Contains information about all contributors to EpicAI Pro
 */
export type TeamMember = {
	name: string
	title: string
	description: string
	link?: { url: string; label: 'X' | 'Bluesky' | 'Website' }
	avatar: string
}

const team: TeamMember[] = [
	{
		name: 'Kent C. Dodds',
		title: 'Workshop Creation and Instruction',
		description:
			'Kent designed, created and recorded all the material for EpicAI Pro to teach you everything about building AI-powered applications. He has rigorously tested the content through live workshops and refined it based on learner feedback.',
		link: { url: 'https://x.com/kentcdodds', label: 'X' },
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1718221991/epicweb.dev/instructors/kent-c-dodds.png',
	},
	{
		name: 'Joel Hooks',
		title: 'Executive Producer',
		description:
			'Joel managed and coordinated the production of EpicAI Pro, working closely with Kent from conception to implementation as well as serving as technical architect and lead developer for the custom courseware that drives the course.',
		link: { url: 'https://x.com/jhooks', label: 'X' },
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1696527108/epicweb.dev/instructors/joel-hooks.jpg',
	},
	{
		name: 'Vojta Holik',
		title: 'UI/UX Design & Development',
		description:
			'As product designer/developer, Vojta handled the UI/UX design and development of EpicAI Pro.',
		link: { url: 'https://x.com/vojta_holik', label: 'X' },
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1696527108/epicweb.dev/instructors/vojta-holik.jpg',
	},
	{
		name: 'Cree Provinsal',
		title: 'Content Production and Review',
		description:
			'Cree reviewed and edited lesson transcripts to ensure they were accurate and matched up with the lessons.',
		link: { url: 'https://x.com/cprovinsal', label: 'X' },
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1696527108/epicweb.dev/instructors/cree-provinsal.jpg',
	},
]

export default team
