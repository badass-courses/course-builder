/**
 * Team member data for the credits page
 * Contains information about all contributors to Epic AI
 */
export type TeamMember = {
	name: string
	title: string
	description: string
	xHandle?: string
	website?: string
	avatar: string
}

const team: TeamMember[] = [
	{
		name: 'Kent C. Dodds',
		title: 'Instructor and Creator',
		description:
			'Kent designed, created and recorded the learning material for EpicAI. He’s rigorously tested the content in a series of live workshops and revised it based on feedback from learners. This resulted in a collection of professional, exercise-driven, self-paced workshops that offer a deep-dive into AI and MCP development, leveraging modern technologies to achieve first-class user experiences with a high level of collaborative maintainability and simplicity.',
		xHandle: 'kentcdodds',
		website: 'https://kentcdodds.com',
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1767808784/team/kent-c-dodds.jpg',
	},
	{
		name: 'Joel Hooks',
		title: 'Executive Producer & Tech Lead',
		description:
			'Joel provided direction and guidance for the development and production of Epic AI throughout the process. He also served as the technical architect, leading the development and infrastructure work.',
		xHandle: 'jhooks',
		website: 'https://joelhooks.com',
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1767808603/team/joel-hooks.jpg',
	},
	{
		name: 'Nicoll Guarnizo',
		title: 'Associate Producer & Developer',
		description: 'Nicoll lead backend development and QA reviews.',
		xHandle: 'guarnizonicoll',
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1767808603/team/nicoll-guarnizo.jpg',
	},
	{
		name: 'Vojta Holik',
		title: 'Product Designer & Developer',
		description:
			'Vojta is responsible for the UI/UX design and development for Epic AI. He also provided the art direction.',
		xHandle: 'vojta_holik',
		website: 'https://vojta.io',
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1767808603/team/vojta-holik.jpg',
	},
	{
		name: 'Zac Jones',
		title: 'Associate Producer & Developer',
		description: '',
		xHandle: 'zacjones93',
		avatar:
			'https://res.cloudinary.com/epic-web/image/upload/v1767891003/team/zac-jones.jpg',
	},
]

export default team
