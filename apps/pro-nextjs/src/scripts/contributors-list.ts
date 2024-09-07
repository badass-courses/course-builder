import { db } from '@/db'
import { contentContributions, users } from '@/db/schema'
import { guid } from '@/utils/guid'
import { eq } from 'drizzle-orm'

export const contributors: Record<string, string> = {
	'shaundai-person': '0b2db156-e2ec-44e9-adeb-bc2125c9c2b9',
	'artem-zakharchenko': '34dadeab-fb58-4310-8375-cfa4fb0a5015',
	'simon-vrachliotis': '5e2a53a5-d0b4-47c8-8b45-c50bae42bfbf',
	'kent-c-dodds': '4ef27e5f-00b4-4aa3-b3c4-4a58ae76f50b',
	chantastic: '78f386b0-7816-4af0-a3e2-a8f77217e7db',
	'jack-herrington': '4ab75994-3310-4589-a0b8-1557c4a21829',
}

const contributionTypeHash: Record<string, string> = {
	author: 'contribution_type_clt4wta5w000808l5c1qi0ud4',
	instructor: 'contribution_type_clwty5w1i000008l1c4d9f7vr',
	host: 'contribution_type_clwxx87i0000008mag2gl90yu',
	presenter: 'contribution_type_clwxx8dyu000108macmbr6kke',
}

export async function recordResourceContribution(
	{
		contributorSlug,
		resourceId,
		contributionType = 'author',
	}: {
		contributorSlug: string
		resourceId: string
		contributionType?: string
	},
	WRITE_TO_DB: boolean = true,
) {
	const contributorId = contributors[contributorSlug]

	if (!contributorId) {
		console.error('contributor not found', contributorSlug)
		return
	}

	const user = await db.query.users?.findFirst({
		where: eq(users.id, contributorId),
	})

	if (!user) {
		console.error('user not found', contributorId)
		return
	}

	const contributionTypeId = contributionTypeHash[contributionType]

	if (!contributionTypeId) {
		console.error('contributionType not found', contributionType)
		return
	}

	console.info(`created ${contributionType} for`, user.name)

	WRITE_TO_DB &&
		(await db.insert(contentContributions).values({
			id: `cc-${guid()}`,
			userId: user.id,
			contentId: resourceId,
			contributionTypeId,
		}))

	return user
}
