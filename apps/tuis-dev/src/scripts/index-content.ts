import { db } from '@/db'
import { indexAllContentToTypeSense } from '@/lib/typesense-query'

const SHOULD_DELETE_ALL_FIRST = true

async function main() {
	try {
		const resources = await db.query.contentResource.findMany({
			with: {
				resources: {
					with: {
						resource: true,
					},
				},
			},
		})
		if (!resources) {
			console.log('No resources found to process')
			return
		}
		console.log(`Found ${resources.length} resources to process`)
		await indexAllContentToTypeSense(resources as any, SHOULD_DELETE_ALL_FIRST)
		console.log('Indexing completed')
	} catch (error) {
		console.error('Failed to index content:', error)
	}
	process.exit(0)
}

main()
