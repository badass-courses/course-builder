import { db } from '@/server/db'
import { contentContributions, contentResource, contributionTypes, users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

export async function fetchContentResourcesWithTypeAndUserContributions(typeName: string) {
  const query = db
    .select()
    .from(contentResource)
    .where(eq(contentResource.type, typeName))
    .leftJoin(contentContributions, eq(contentContributions.contentId, contentResource.id))
    .leftJoin(users, eq(users.id, contentContributions.userId))
    .leftJoin(contributionTypes, eq(contributionTypes.id, contentContributions.contributionTypeId))

  const rawData = await query.execute()

  const normalizedData = rawData.reduce((acc: any, row: any) => {
    // Initialize contentResource if not already present
    if (!acc[row.contentResource.id]) {
      acc[row.contentResource.id] = {
        id: row.contentResource.id,
        title: row.contentResource.title,
        type: row.contentResource.type,
        slug: row.contentResource.slug,
        body: row.contentResource.body,
        resources: row.contentResource.resources,
        metadata: row.contentResource.metadata,
        contributions: {},
      }
    }

    // Initialize contributionType group if not already present
    const contributionType = row.contributionType.slug
    if (!acc[row.contentResource.id].contributions[contributionType]) {
      acc[row.contentResource.id].contributions[contributionType] = []
    }

    // Add contributor to the contributionType group
    acc[row.contentResource.id].contributions[contributionType].push({
      id: row.user.id,
      name: row.user.name,
      image: row.user.image,
      // Add other user fields as needed
    })

    return acc
  }, {})

  return Object.values(normalizedData)
}
