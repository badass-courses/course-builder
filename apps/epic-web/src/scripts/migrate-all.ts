import { writeContributionTypes } from '@/scripts/controbution-types'
import { migrateArticles } from '@/scripts/migrate-articles'
import { migrateTips } from '@/scripts/migrate-tips'
import { migrateTutorials } from '@/scripts/migrate-tutorials'

await writeContributionTypes()
await migrateArticles()
await migrateTips()
await migrateTutorials()
