//add contribution types
import { db } from '@/db'
import { contributionTypes } from '@/db/schema'
import { eq } from 'drizzle-orm'

const contributionTypeList = [
	{
		id: 'contribution_type_clt4wta5w000808l5c1qi0ud4',
		slug: 'author',
		name: 'Author',
		description: 'Contributor who created the content',
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	},
	{
		id: 'contribution_type_clt4wubil000908l50ikcd7dx',
		slug: 'editor',
		name: 'Editor',
		description: 'Contributor who edited the content',
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	},
	{
		id: 'contribution_type_clwty5w1i000008l1c4d9f7vr',
		slug: 'instructor',
		name: 'Instructor',
		description: 'Contributor who taught the content',
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	},
	{
		id: 'contribution_type_clwxx87i0000008mag2gl90yu',
		slug: 'host',
		name: 'Host',
		description: 'Contributor who hosted the event',
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	},
	{
		id: 'contribution_type_clwxx8dyu000108macmbr6kke',
		slug: 'presenter',
		name: 'Presenter',
		description: 'Contributor who presented the content',
		active: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
	},
]

export async function writeContributionTypes() {
	for (const contributionType of contributionTypeList) {
		const type = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.id, contributionType.id),
		})
		if (!type) {
			console.log('inserting contribution type', contributionType)
			await db.insert(contributionTypes).values(contributionType)
		}
	}
}
